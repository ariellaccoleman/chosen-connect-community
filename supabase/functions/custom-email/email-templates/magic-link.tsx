
import * as React from "npm:react@18.2.0";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.10";

interface MagicLinkEmailProps {
  signInLink: string;
}

export const MagicLinkEmail = ({
  signInLink,
}: MagicLinkEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your CHOSEN sign-in link</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://picsum.photos/200"
            width="120"
            height="50"
            alt="CHOSEN Logo"
            style={logo}
          />
          <Heading style={heading}>Your Sign-In Link</Heading>
          <Text style={paragraph}>
            Welcome back to CHOSEN! Click the button below to sign in to your account.
            This link will expire in 24 hours.
          </Text>
          <Section style={buttonContainer}>
            <Link
              style={button}
              href={signInLink}
              target="_blank"
            >
              Sign In to CHOSEN
            </Link>
          </Section>
          <Text style={paragraph}>
            If you didn't request this email, you can safely ignore it.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            &copy; {new Date().getFullYear()} CHOSEN Community. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const logo = {
  margin: "0 auto",
  marginBottom: "32px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#2754C5",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "42px 0 26px",
};

const footer = {
  fontSize: "12px",
  lineHeight: "16px",
  color: "#b4becc",
  textAlign: "center" as const,
};
