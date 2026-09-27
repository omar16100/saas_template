import { Html, Body, Container, Heading, Text, Button } from "@react-email/components";

export function renderWelcome({ name, appName }: { name: string; appName: string }) {
  return (
    <Html>
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <Container>
          <Heading>Welcome, {name}.</Heading>
          <Text>Thanks for signing up to {appName}. You&apos;re in.</Text>
          <Button href="/" style={{ background: "#000", color: "#fff", padding: "10px 16px", borderRadius: 6 }}>
            Open dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
