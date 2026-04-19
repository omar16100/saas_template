import { Html, Body, Container, Heading, Text, Link } from "@react-email/components";

export function renderVerify({ url, appName }: { url: string; appName: string }) {
  return (
    <Html>
      <Body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <Container>
          <Heading>Verify your email</Heading>
          <Text>Confirm your email address for {appName}.</Text>
          <Link href={url}>Verify email</Link>
          <Text style={{ fontSize: 12, color: "#888" }}>Or paste: {url}</Text>
        </Container>
      </Body>
    </Html>
  );
}
