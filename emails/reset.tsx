import { Html, Body, Container, Heading, Text, Link } from "@react-email/components";

export function renderReset({ url, appName }: { url: string; appName: string }) {
  return (
    <Html>
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <Container>
          <Heading>Reset your password</Heading>
          <Text>Click to reset your {appName} password. Link expires in 1 hour.</Text>
          <Link href={url}>Reset password</Link>
        </Container>
      </Body>
    </Html>
  );
}
