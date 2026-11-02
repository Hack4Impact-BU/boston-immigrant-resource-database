const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

// Whole days since an update, counted the way "Updated ..." counts them, or null when there is no date to count from.
function getElapsedUpdateDays(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - parsedDate.getTime()) / DAY_IN_MILLISECONDS);
}

export function formatRelativeUpdateDate(value?: string): string {
  const elapsedDays = getElapsedUpdateDays(value);

  if (elapsedDays === null) {
    return "Updated recently";
  }

  if (elapsedDays <= 0) {
    return "Updated today";
  }

  if (elapsedDays === 1) {
    return "Updated 1 day ago";
  }

  return `Updated ${elapsedDays} days ago`;
}

/**
 * Whether formatRelativeUpdateDate says "Updated today" for this date. "Today" there is the last 24 hours, not the calendar day, and
 * this is the same rule, so that whatever is hidden when something was updated today is hidden exactly when the text says so.
 */
export function isUpdatedToday(value?: string): boolean {
  const elapsedDays = getElapsedUpdateDays(value);

  return elapsedDays !== null && elapsedDays <= 0;
}
