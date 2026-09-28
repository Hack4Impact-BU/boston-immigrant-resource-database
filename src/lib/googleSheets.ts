import Papa from "papaparse";

/**
 * Fetches the live values of a publicly-viewable Google Sheet ("anyone with
 * the link can view") via Google's public CSV export endpoint. This is a
 * plain, unauthenticated HTTP request — no API key or service account needed,
 * matching the sheet's own current sharing setting. If the sheet's sharing
 * setting ever changes to restrict access, this will start failing and would
 * need the Sheets API with a key instead.
 *
 * Always fetches fresh (no caching) since the caller wants live values, not a
 * snapshot.
 */
export async function fetchPublicSheetAsCsv(sheetId: string, gid?: string): Promise<string> {
	const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ""}`;

	const response = await fetch(url, { cache: "no-store" });

	if (!response.ok) {
		throw new Error(`Failed to fetch Google Sheet (status ${response.status}). It may no longer be shared as "anyone with the link can view".`);
	}

	return response.text();
}

export type SheetRow = Record<string, string>;

/**
 * Parses a CSV string (as returned by fetchPublicSheetAsCsv) into row objects
 * keyed by the sheet's own header row. Uses papaparse rather than a naive
 * split(",") since this data has commas and newlines embedded within quoted
 * cell values throughout (multi-line free-text answers, comma-joined
 * checkbox responses).
 */
export function parseSheetCsv(csvText: string): { rows: SheetRow[]; headers: string[] } {
	const parsed = Papa.parse<SheetRow>(csvText, {
		header: true,
		skipEmptyLines: true,
	});

	return { rows: parsed.data, headers: parsed.meta.fields ?? [] };
}

function normalizeHeader(header: string): string {
	// Collapses embedded newlines/multi-space runs (common in Google Forms
	// question text that wraps to multiple lines) down to single spaces, so
	// prefix matching isn't thrown off by whitespace that can't be predicted
	// without seeing the sheet's raw, live bytes.
	return header.replace(/\s+/g, " ").trim();
}

/**
 * Finds the actual, real header string in a parsed sheet's headers that
 * starts with the given prefix (after whitespace normalization), so callers
 * can reference a short, stable prefix rather than hard-coding a long,
 * whitespace-sensitive full header (many of which contain embedded
 * instructions or multi-line question text).
 */
export function findHeaderByPrefix(headers: string[], prefix: string): string | undefined {
	const normalizedPrefix = normalizeHeader(prefix).toLowerCase();
	return headers.find((header) => normalizeHeader(header).toLowerCase().startsWith(normalizedPrefix));
}
