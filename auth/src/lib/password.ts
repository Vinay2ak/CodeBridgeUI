const COMMON_PASSWORDS: readonly string[] = [
  "password1234",
  "123456789012",
  "qwertyuiop12",
  "password12345",
  "abcdefghijk1",
  "1234567890ab",
  "admin123456!",
  "letmein12345",
  "welcome12345",
  "monkey123456",
  "dragon123456",
  "master123456",
  "sunshine1234",
  "princess1234",
  "football1234",
  "baseball1234",
  "shadow123456",
  "trustno11234",
  "batman123456",
  "superman1234",
];

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export function checkPassword(password: string, email: string): PasswordRule[] {
  const emailName = email.split("@")[0] ?? "";
  const emailPart = emailName.length >= 3 ? emailName.toLowerCase() : "";

  return [
    {
      id: "length",
      label: "At least 12 characters",
      met: password.length >= 12,
    },
    {
      id: "unique",
      label: "Uses at least 5 different characters",
      met: new Set(password).size >= 5,
    },
    {
      id: "email",
      label: "Doesn't contain your email name",
      met: emailPart === "" || !password.toLowerCase().includes(emailPart),
    },
    {
      id: "common",
      label: "Not a very common password",
      met: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    },
  ];
}

export type PasswordStrength = "weak" | "okay" | "strong";

export function strength(password: string, email: string): PasswordStrength {
  if (password.length === 0) return "weak";
  const rules = checkPassword(password, email);
  const allMet = rules.every((r) => r.met);
  if (!allMet) return "weak";
  if (password.length >= 16) return "strong";
  return "okay";
}
