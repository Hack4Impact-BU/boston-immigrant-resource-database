// What Airtable has for a provider that supports every language.
export const ALL_LANGUAGES = "All Languages";

/**
 * Whether a provider gets past the Languages filter. With nothing selected, every provider does. Otherwise a provider does if it supports
 * any of the selected languages, or if it supports "All Languages", since that covers whichever language was picked. Search Services and
 * the Providers page both use this, so they filter the same way.
 */
export function matchesLanguageFilter(selectedLanguages: readonly string[], providerLanguages: readonly string[]) {
  if (selectedLanguages.length === 0) {
    return true;
  }

  return providerLanguages.includes(ALL_LANGUAGES) || selectedLanguages.some((language) => providerLanguages.includes(language));
}
