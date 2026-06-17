export type AuthEmailTemplate = {
  subject: string;
  text: string;
};

export function buildEmailVerificationTemplate(token: string): AuthEmailTemplate {
  return {
    subject: "Verify your The Vastra House account",
    text: `Use this verification token to verify your account: ${token}`,
  };
}

export function buildPasswordResetTemplate(token: string): AuthEmailTemplate {
  return {
    subject: "Reset your The Vastra House password",
    text: `Use this password reset token within 30 minutes: ${token}`,
  };
}

export function buildOtpTemplate(code: string): AuthEmailTemplate {
  return {
    subject: "Your The Vastra House OTP",
    text: `Your OTP is ${code}. It expires in 10 minutes.`,
  };
}
