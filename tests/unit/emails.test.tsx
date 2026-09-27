// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderWelcome } from "@/emails/welcome";
import { renderVerify } from "@/emails/verify";
import { renderReset } from "@/emails/reset";
import { renderMagicLink } from "@/emails/magic-link";
import { renderDeletionConfirm } from "@/emails/deletion-confirm";

// Guards the @react-email/components upgrades: every template still renders its link and app name.
const APP = "Acme";
const URL_WITH_QUERY = "https://app.example.com/api/auth/verify?token=abc&callbackURL=%2Fdashboard";
const ESCAPED_URL = URL_WITH_QUERY.replace("&", "&amp;");

describe("email templates", () => {
  it.each([
    ["verify", renderVerify],
    ["reset", renderReset],
    ["magic link", renderMagicLink],
  ])("%s email links to the given URL and names the app", (_name, render) => {
    const html = renderToStaticMarkup(render({ url: URL_WITH_QUERY, appName: APP }));
    expect(html).toContain(`href="${ESCAPED_URL}"`);
    expect(html).toContain(APP);
    expect(html.startsWith("<html")).toBe(true);
  });

  it("welcome email greets the user and links to the dashboard", () => {
    const html = renderToStaticMarkup(renderWelcome({ name: "Ada", appName: APP }));
    expect(html).toContain("Welcome, Ada.");
    expect(html).toContain(APP);
    expect(html).toContain('href="/"');
  });

  it("deletion email states the purge date in UTC", () => {
    const purgeAt = new Date(Date.UTC(2026, 9, 27));
    const html = renderToStaticMarkup(renderDeletionConfirm({ purgeAt, appName: APP }));
    expect(html).toContain("<strong>Tue, 27 Oct 2026 00:00:00 GMT</strong>");
    expect(html).toContain(APP);
  });
});
