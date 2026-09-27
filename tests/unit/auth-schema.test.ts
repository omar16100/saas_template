import { describe, it, expect, vi, afterEach } from "vitest";
import { getTableColumns, is } from "drizzle-orm";
import { getTableConfig, SQLiteTable, type SQLiteColumn } from "drizzle-orm/sqlite-core";
import { getAuthTables } from "better-auth/db";
import * as schema from "@/db/schema";

const { getCloudflareContext } = vi.hoisted(() => ({ getCloudflareContext: vi.fn() }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

// The drizzle column dataType each Better Auth field type is stored as.
const DATA_TYPE_BY_FIELD_TYPE: Record<string, string> = {
  string: "string",
  boolean: "boolean",
  date: "date",
  number: "number",
};

// passkey.createdAt: NOT NULL predates the plugin marking it optional and dropping it needs a table rebuild.
// The plugin writes a Date on registration and never null; the column's Drizzle default covers omission.
const NOT_NULL_OPTIONAL_FIELDS = new Set(["passkey.createdAt"]);

// Better Auth validates the Drizzle schema against every enabled plugin on each auth request and
// fails the request on any mismatch, so a missing plugin field breaks sign-in, not just that plugin.
async function authContext() {
  getCloudflareContext.mockImplementation(() => ({ env: { DB: {} } }));
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { getAuth } = await import("@/lib/auth");
  return getAuth().$context;
}

function drizzleTable(key: string) {
  const table = (schema as Record<string, unknown>)[key];
  return is(table, SQLiteTable) ? table : undefined;
}

function isIndexed(table: SQLiteTable, column: SQLiteColumn) {
  if (column.isUnique || column.primary) return true;
  return getTableConfig(table).indexes.some((i) => i.config.columns[0] === column);
}

function isUniqueColumn(table: SQLiteTable, column: SQLiteColumn) {
  if (column.isUnique || column.primary) return true;
  return getTableConfig(table).indexes.some((i) => i.config.unique && i.config.columns.length === 1 && i.config.columns[0] === column);
}

// Everything Better Auth's own check covers (tables, columns, required columns it never writes)
// plus what it does not check: column types, nullability of optional fields, unique and index flags,
// and foreign keys.
function schemaProblems(options: Parameters<typeof getAuthTables>[0]) {
  const problems: string[] = [];
  for (const [key, authTable] of Object.entries(getAuthTables(options))) {
    if (authTable.disableMigrations) continue;
    const table = drizzleTable(authTable.modelName);
    if (!table) {
      problems.push(`missing table export "${authTable.modelName}" (${key})`);
      continue;
    }
    const columns = getTableColumns(table) as Record<string, SQLiteColumn>;
    if (!columns.id?.primary) problems.push(`${authTable.modelName}.id is not the primary key`);
    for (const [fieldKey, field] of Object.entries(authTable.fields)) {
      const name = field.fieldName || fieldKey;
      const where = `${authTable.modelName}.${name}`;
      const column = columns[name];
      if (!column) {
        problems.push(`missing column ${where}`);
        continue;
      }
      const expectedType = DATA_TYPE_BY_FIELD_TYPE[String(field.type)];
      if (column.dataType !== expectedType) problems.push(`${where} is ${column.dataType}, expected ${expectedType ?? String(field.type)}`);
      // Better Auth may leave an optional field out of an insert or write it as null (the two-factor
      // plugin resets locked_until to null), so a Drizzle default alone is not enough: the column must be nullable.
      if (!field.required && field.defaultValue === undefined && column.notNull) {
        const isAllowed = NOT_NULL_OPTIONAL_FIELDS.has(where) && column.hasDefault;
        if (!isAllowed) problems.push(`${where} is optional in Better Auth but NOT NULL`);
      }
      if (field.unique && !isUniqueColumn(table, column)) problems.push(`${where} must be unique`);
      if (field.index && !isIndexed(table, column)) problems.push(`${where} must be indexed`);
      if (field.references) {
        const target = drizzleTable(field.references.model);
        const fk = getTableConfig(table).foreignKeys.map((f) => f.reference()).find((r) => r.columns[0] === column);
        const targetColumn = target && (getTableColumns(target) as Record<string, SQLiteColumn>)[field.references.field];
        if (!fk || fk.foreignTable !== target || fk.foreignColumns[0] !== targetColumn) {
          problems.push(`${where} must reference ${field.references.model}.${field.references.field}`);
        }
      }
    }
  }
  return problems;
}

describe("auth schema", () => {
  afterEach(() => vi.restoreAllMocks());

  it("enables the plugins whose tables this test guards", async () => {
    const ctx = await authContext();
    expect(ctx.options.plugins?.map((p) => p.id)).toEqual(expect.arrayContaining(["passkey", "two-factor", "magic-link"]));
  });

  it("passes Better Auth's own runtime schema check for the configured plugins", async () => {
    const ctx = await authContext();
    expect(ctx.explicitSchemaCheck).toBeTypeOf("function");
    await expect(Promise.resolve(ctx.explicitSchemaCheck?.())).resolves.toBeUndefined();
  });

  it("maps every table and field Better Auth writes to a Drizzle column of the right type, index and reference", async () => {
    const ctx = await authContext();
    expect(schemaProblems(ctx.options)).toEqual([]);
  });

  it("deletes a user's passkeys and two-factor secrets with the user", () => {
    for (const table of [schema.passkey, schema.twoFactor]) {
      const userFk = getTableConfig(table).foreignKeys.find((f) => f.reference().foreignTable === schema.user);
      expect(userFk?.onDelete, getTableConfig(table).name).toBe("cascade");
    }
  });

  it("allows one passkey row per credential and one two-factor row per user", () => {
    expect(isUniqueColumn(schema.passkey, schema.passkey.credentialID)).toBe(true);
    expect(isUniqueColumn(schema.twoFactor, schema.twoFactor.userId)).toBe(true);
  });
});
