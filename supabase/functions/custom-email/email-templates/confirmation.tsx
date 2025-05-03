
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

interface ConfirmationEmailProps {
  confirmLink: string;
  firstName?: string;
}

export const ConfirmationEmail = ({
  confirmLink,
  firstName = "",
}: ConfirmationEmailProps) => {
  const greeting = firstName ? `Hello ${firstName},` : "Hello,";

  return (
    <Html>
      <Head />
      <Preview>Welcome to CHOSEN - Please confirm your email</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://picsum.photos/200"
            width="120"
            height="50"
            alt="CHOSEN Logo"
            style={logo}
          />
          <Heading style={heading}>Confirm your email address</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Thank you for joining CHOSEN, a global professional community for Jews and pro-Israel individuals. 
            To complete your registration and start connecting with the community, please confirm your email address.
          </Text>
          <Section style={buttonContainer}>
            <Link
              style={button}
              href={confirmLink}
              target="_blank"
            >
              Confirm Email Address
            </Link>
          </Section>
          <Text style={paragraph}>
            If you didn't sign up for CHOSEN, you can safely ignore this email.
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
