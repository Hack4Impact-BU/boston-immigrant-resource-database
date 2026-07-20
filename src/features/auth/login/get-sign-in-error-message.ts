import { getErrorMessage } from "@/features/auth/auth-helpers";

const INVALID_SIGN_IN_MESSAGE = "Username/email or password is incorrect.";
const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

const INVALID_SIGN_IN_CODES = new Set([
  "form_identifier_not_found",
  "form_password_incorrect",
  "identifier_not_found",
  "password_incorrect",
]);

const RATE_LIMIT_CODES = new Set([
  "rate_limit_exceeded",
  "too_many_attempts",
  "too_many_failed_attempts",
  "too_many_requests",
]);

type ClerkErrorDetail = {
  code?: string;
};

type ClerkErrorLike = {
  errors?: ClerkErrorDetail[];
  status?: number;
  statusCode?: number;
};

function getClerkError(error: unknown) {
  if (!error || typeof error !== "object") {
    return;
  }

  return error as ClerkErrorLike;
}

export function getSignInErrorMessage(error: unknown, fallbackMessage: string) {
  const clerkError = getClerkError(error);
  const code = clerkError?.errors?.[0]?.code;
  const statusCode = clerkError?.status ?? clerkError?.statusCode;

  if (statusCode === 429 || (code && RATE_LIMIT_CODES.has(code))) {
    return RATE_LIMIT_MESSAGE;
  }

  if (code && INVALID_SIGN_IN_CODES.has(code)) {
    return INVALID_SIGN_IN_MESSAGE;
  }

  return getErrorMessage(error, fallbackMessage);
}
