import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

/*
 * Keeps what the person has chosen on a page (the search, the filters, the view) in the address bar, so a page can be bookmarked or
 * shared, and Back (from a provider's page, say) brings it back as it was. The address is the one place that state is kept: the hooks
 * below read it with Next's useSearchParams, and change it with the browser's own History API. Next hooks into that API (since 14.1), so
 * useSearchParams follows along, and nothing is requested from the server, which matters on a page that loads its data on the server.
 */

type UpdateOptions = {
  /** Adds a history entry, so that Back undoes this change. Without it the current entry is replaced, and Back goes on to the page before. */
  push?: boolean;
  /** Data to keep in the history entry, to tell later on that this app made it (see getCustomHistoryValue). */
  state?: Record<string, unknown>;
};

// What Next keeps in the state of a history entry for its own use. Next ignores a pushState or replaceState call whose state has
// any of these in it (it takes the call to be its own), so they must be left out of what is passed in. Next adds them back itself.
const NEXT_HISTORY_STATE_KEYS = ["__NA", "_N", "__PRIVATE_NEXTJS_INTERNALS_TREE"];

function getCustomHistoryState(): Record<string, unknown> {
  const current: unknown = window.history.state;

  if (!current || typeof current !== "object") {
    return {};
  }

  return Object.fromEntries(Object.entries(current).filter(([key]) => !NEXT_HISTORY_STATE_KEYS.includes(key)));
}

export function getCustomHistoryValue(key: string) {
  return getCustomHistoryState()[key];
}

/** Changes the search parameters in the address bar (the part after the ?). Does nothing if the change leaves them as they were. */
export function updateSearchParams(update: (params: URLSearchParams) => void, { push = false, state }: UpdateOptions = {}) {
  const url = new URL(window.location.href);
  const before = url.search;

  update(url.searchParams);

  if (url.search === before) {
    return;
  }

  const target = `${url.pathname}${url.search}${url.hash}`;

  if (push) {
    window.history.pushState(state ?? {}, "", target);
  } else {
    window.history.replaceState({ ...getCustomHistoryState(), ...state }, "", target);
  }
}

/**
 * One choice out of a fixed set (a view, a sort order), kept in the address as ?name=value. The default is left out of the address,
 * and so is anything that isn't one of the allowed values (from an old bookmark, or one that was typed in), which is the default.
 */
export function useUrlValue<T extends string>(name: string, allowed: readonly T[], fallback: T) {
  const searchParams = useSearchParams();
  const raw = searchParams.get(name);
  const value = allowed.find((option) => option === raw) ?? fallback;

  const setValue = useCallback(
    (next: T) => {
      updateSearchParams((params) => {
        if (next === fallback) {
          params.delete(name);
        } else {
          params.set(name, next);
        }
      });
    },
    [fallback, name],
  );

  return [value, setValue] as const;
}

/**
 * Any number of choices (a filter), kept in the address as ?name=a&name=b. When the options are known, anything in the address that
 * isn't one of them is ignored, rather than filtering everything out with something that can't be seen or unselected. The setter takes
 * the new list, or a function of the current one, like a useState setter.
 */
export function useUrlList(name: string, validOptions?: readonly string[]) {
  const searchParams = useSearchParams();
  const fromAddress = useMemo(() => searchParams.getAll(name), [name, searchParams]);
  const values = useMemo(
    () => (validOptions ? fromAddress.filter((value) => validOptions.includes(value)) : fromAddress),
    [fromAddress, validOptions],
  );

  const setValues = useCallback(
    (next: string[] | ((current: string[]) => string[])) => {
      const resolved = Array.from(new Set(typeof next === "function" ? next(values) : next));

      updateSearchParams((params) => {
        params.delete(name);
        resolved.forEach((value) => params.append(name, value));
      });
    },
    [name, values],
  );

  return [values, setValues] as const;
}

/**
 * Text typed in a box (the search), kept in the address as ?name=text. The box shows what was typed straight away, but the address is
 * only changed once typing pauses (browsers limit how often it can be changed, and the whole page follows each change), or when the box
 * is left. Back and Forward put in the box whatever the address then says.
 */
export function useUrlText(name: string, delayMs = 300) {
  const searchParams = useSearchParams();
  const [text, setTextState] = useState(() => searchParams.get(name) ?? "");
  const latest = useRef(text);
  const timer = useRef<number | undefined>(undefined);

  const write = useCallback(
    (value: string) => {
      window.clearTimeout(timer.current);
      timer.current = undefined;

      updateSearchParams((params) => {
        if (value.trim()) {
          params.set(name, value);
        } else {
          params.delete(name);
        }
      });
    },
    [name],
  );

  const setText = useCallback(
    (value: string) => {
      latest.current = value;
      setTextState(value);

      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => write(latest.current), delayMs);
    },
    [delayMs, write],
  );

  /** Puts a change that is still waiting for typing to pause into the address now (for when the box is left). */
  const commit = useCallback(() => {
    if (timer.current !== undefined) {
      write(latest.current);
    }
  }, [write]);

  /** Empties the box now, without touching the address, for a caller that is clearing other things in it too (like Clear All). */
  const reset = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    latest.current = "";
    setTextState("");
  }, []);

  /** Empties the box and takes the text out of the address. */
  const clear = useCallback(() => {
    reset();
    write("");
  }, [reset, write]);

  useEffect(() => {
    function handlePopState() {
      window.clearTimeout(timer.current);
      timer.current = undefined;

      const value = new URLSearchParams(window.location.search).get(name) ?? "";
      latest.current = value;
      setTextState(value);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.clearTimeout(timer.current);
    };
  }, [name]);

  return { text, setText, commit, reset, clear };
}
