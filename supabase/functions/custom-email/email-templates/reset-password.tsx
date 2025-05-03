
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
      <Preview>Reset your CHOSEN password</Preview>
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
            You recently requested to reset your password for your CHOSEN account.
            Click the button below to reset it. This link will expire in 1 hour.
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
            If you did not request a password reset, please ignore this email or contact
            support if you have questions.
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
