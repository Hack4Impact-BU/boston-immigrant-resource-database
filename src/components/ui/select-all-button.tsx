"use client";

/**
 * True when at least one of the listed options isn't selected yet, i.e. when "Select All" would do something.
 */
export function canSelectMore(visibleOptions: readonly string[], selected: readonly string[]): boolean {
  return visibleOptions.some((option) => !selected.includes(option));
}

type SelectAllButtonProps = {
  /** Every option in the drop-down. */
  options: readonly string[];
  /** The options currently listed: all of them, or only those matching the panel's search box. */
  visibleOptions: readonly string[];
  selected: readonly string[];
  /** Receives the complete new selection. */
  onSelect: (values: string[]) => void;
  className?: string;
};

/**
 * "Select All" for a filter drop-down. It adds every listed option to the selection and leaves anything already selected
 * alone, so after searching it selects just the matches without dropping earlier picks. Like "Clear All", it hides when
 * there is nothing for it to do (everything listed is already selected, or the search matched nothing).
 */
export function SelectAllButton({ options, visibleOptions, selected, onSelect, className }: SelectAllButtonProps) {
  if (!canSelectMore(visibleOptions, selected)) {
    return null;
  }

  // The wording says what the click will do: every option, or only the ones the search has narrowed the list down to.
  const isNarrowed = visibleOptions.length < options.length;

  return (
    <button type="button" onClick={() => onSelect(Array.from(new Set([...selected, ...visibleOptions])))} className={className}>
      {isNarrowed ? "Select All Matches" : "Select All"}
    </button>
  );
}
