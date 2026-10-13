type ClerkMethodResult = {
  error: Error | null;
};

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
