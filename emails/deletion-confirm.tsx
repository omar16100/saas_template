import { Html, Body, Container, Heading, Text } from "@react-email/components";

export function renderDeletionConfirm({ purgeAt, appName }: { purgeAt: Date; appName: string }) {
  return (
    <Html>
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <Container>
          <Heading>Account deletion scheduled</Heading>
          <Text>
            Your {appName} account will be permanently deleted on{" "}
            <strong>{purgeAt.toUTCString()}</strong>. Sign in before then to cancel.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
