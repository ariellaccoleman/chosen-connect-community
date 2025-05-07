
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

interface ResetPasswordEmailProps {
  resetLink: string;
}

export const ResetPasswordEmail = ({
  resetLink,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your CHOSEN Community password securely</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://picsum.photos/200"
            width="120"
            height="50"
            alt="CHOSEN Logo"
            style={logo}
          />
          <Heading style={heading}>Reset Your Password</Heading>
          <Text style={paragraph}>
            We received a request to reset the password for your CHOSEN Community account.
            Click the button below to set a new password. This link will expire in 1 hour.
          </Text>
          <Section style={buttonContainer}>
            <Link
              style={button}
              href={resetLink}
              target="_blank"
            >
              Reset Password
            </Link>
          </Section>
          <Text style={paragraph}>
            If you're having trouble clicking the button, copy and paste this link into your web browser:
          </Text>
          <Text style={linkText}>
            {resetLink}
          </Text>
          <Text style={paragraph}>
            If you did not request a password reset, please ignore this email or contact
            support if you have questions about account security.
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
  maxWidth: "600px",
  borderRadius: "5px",
  boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
};

const logo = {
  margin: "0 auto",
  marginBottom: "32px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#2754C5",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#484848",
  marginBottom: "16px",
  padding: "0 24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
  marginTop: "32px",
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
  margin: "0 auto",
  maxWidth: "240px",
};

const linkText = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#2754C5",
  padding: "0 24px",
  margin: "12px 0",
  wordBreak: "break-all" as const,
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
  padding: "0 24px",
};

