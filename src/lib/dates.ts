export function formatRelativeUpdateDate(value?: string): string {
  if (!value) {
    return "Updated recently";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Updated recently";
  }

  const elapsedDays = Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0) {
    return "Updated today";
  }

  if (elapsedDays === 1) {
    return "Updated 1 day ago";
  }

  return `Updated ${elapsedDays} days ago`;
}

export function formatRelativeUpdateDateShort(value?: string): string {
  if (!value) {
    return "Recent";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Recent";
  }

  const elapsedDays = Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (elapsedDays <= 0) {
    return "Today";
  }

  if (elapsedDays === 1) {
    return "1 day ago";
  }

  return `${elapsedDays} days ago`;
}
