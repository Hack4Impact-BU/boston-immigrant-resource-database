type ClerkMethodResult = {
  error: Error | null;
};

// Clerk's error for signing in or up when this browser already has a signed-in session ("You're already signed in."). Clerk says its
// message text isn't stable and shouldn't be parsed, so this goes by the error's code, which is on the error itself and on each of
// the details in its `errors` list, depending on the kind of error.
const SESSION_EXISTS_CODE = "session_exists";

export function isSessionExistsError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { code, errors } = error as { code?: unknown; errors?: unknown };

  return (
    code === SESSION_EXISTS_CODE ||
    (Array.isArray(errors) &&
      errors.some((detail) => Boolean(detail) && typeof detail === "object" && (detail as { code?: unknown }).code === SESSION_EXISTS_CODE))
  );
}

export function getRequiredFormString(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

export function requireNonEmptyString(value: string, fieldName: string) {
  if (!value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

// Server-side enforcement of fields the form marks as required — client-side
// validation alone isn't a real guarantee, since a Server Action is reachable
// directly, not only through the form's own UI.
export function requireNonEmptySelection(values: string[], fieldName: string): string[] {
  if (values.length === 0) {
    throw new Error(`Please select at least one ${fieldName}.`);
  }

  return values;
}

export function throwIfClerkError(result: ClerkMethodResult) {
  if (result.error) {
    throw result.error;
  }
}
