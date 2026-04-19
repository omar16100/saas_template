import { Html, Body, Container, Heading, Text, Link } from "@react-email/components";

export function renderMagicLink({ url, appName }: { url: string; appName: string }) {
  return (
    <Html>
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <Container>
          <Heading>Sign in to {appName}</Heading>
          <Text>Click the link below to sign in. Expires in 10 minutes.</Text>
          <Link href={url}>Sign in</Link>
        </Container>
      </Body>
    </Html>
  );
}
