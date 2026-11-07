import isEmail from "validator/es/lib/isEmail";

// The same check the Backend runs (class-validator's @IsEmail uses this same
// function), so the screen never lets through an email the API refuses.
export const INVALID_EMAIL_MESSAGE = "Informe um e-mail válido, como nome@email.com.";

export function isValidEmail(value: string): boolean {
  return isEmail(value.trim());
}
