"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type PrintFilter = { label: string; value: string };

const DEFAULT_LOGO = "/icons/Just_BIRD_logo_blue.png";

/**
 * A provider's logo on the printout: small, in a box, with the whole logo showing whatever its shape. A provider without a logo gets
 * the BIRD logo, as on the pages, and so does one whose logo can't be loaded (they are links to files in Airtable, which do stop
 * working), so there is never a broken-image icon on paper. It is decoration, with the provider's name beside it, so it has no alt text.
 */
export function PrintLogo({ src }: { src?: string | null }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- provider logos are arbitrary external Airtable attachment URLs, not a fixed set next/image can optimize */}
      <img
        src={src || DEFAULT_LOGO}
        alt=""
        decoding="sync"
        onError={(event) => {
          if (!event.currentTarget.src.endsWith(DEFAULT_LOGO)) {
            event.currentTarget.src = DEFAULT_LOGO;
          }
        }}
        className="h-full w-full object-contain p-1"
      />
    </div>
  );
}

type PrintPreviewProps = {
  isOpen: boolean;
  onClose: () => void;
  /** What is being printed, such as "Providers". */
  title: string;
  /** The search and filters the results were narrowed by. The ones with nothing in them are left out. */
  filters: PrintFilter[];
  /** How many there are, such as "12 of 43 organizations". */
  countText: string;
  /** The rows of the list (<li> elements). */
  children: ReactNode;
};

const getTodayText = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const subscribeToNothing = () => () => {};

/** The button that opens the print preview. Icon-only on a phone, or at any width with iconOnly (its name is still "Print preview"). */
export function PrintPreviewButton({
  onClick,
  disabled = false,
  iconOnly = false,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Nothing to print" : "Print preview"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#a8d0e6] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors cursor-pointer hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white",
        className,
      )}
    >
      <Printer size={14} aria-hidden="true" />
      <span className={iconOnly ? "sr-only" : "max-sm:sr-only"}>Print preview</span>
    </button>
  );
}

/**
 * A preview of a list as it will print, on a sheet of paper, with Print and Close buttons. What it shows is what prints: when the page
 * is printed, a rule in globals.css hides everything on it but this (marked with data-print-root), so the sidebar, the search and
 * filters, and the scrolling box the list normally sits in are not in the way, and the whole list prints, over as many pages as it takes.
 *
 * The printout is in the page all the time, hidden (display: none), and only the preview and the paper show it. That is so that it
 * prints the same however the page is printed (the Print button in the preview, Ctrl+P, or Print in the browser's menu), logos
 * included. It can't be made when the browser says it is about to print: the browser prints at once, without waiting for anything that
 * is still loading, and a logo (an image) made at that moment isn't loaded yet, so it comes out blank. Here the images have loaded
 * long before. The price is that the list is rendered twice, which is why the rows are made from a deferred copy of the results.
 */
export function PrintPreview({ isOpen, onClose, title, filters, countText, children }: PrintPreviewProps) {
  // The printout goes into <body> (so that printing can hide everything else), which only exists in the browser.
  const isInBrowser = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  const [printedOn, setPrintedOn] = useState(getTodayText);
  const printButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // "Printed <date>" is the day it is printed on, which isn't the day the page was opened if it was left open overnight. It is only text,
  // so it is in place by the time the browser lays the page out for printing (flushSync) without anything having to load.
  useEffect(() => {
    const handleBeforePrint = () => flushSync(() => setPrintedOn(getTodayText()));

    window.addEventListener("beforeprint", handleBeforePrint);

    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, []);

  // While it is open: focus goes into it (and back to where it was when it closes), Escape closes it, and the page behind it is made
  // inert, so that a keyboard or a screen reader can't wander off into it.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const pageBehind = Array.from(document.body.children).filter((element) => !element.hasAttribute("data-print-root") && !(element instanceof HTMLScriptElement));

    pageBehind.forEach((element) => element.setAttribute("inert", ""));
    printButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      pageBehind.forEach((element) => element.removeAttribute("inert"));
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isInBrowser) {
    return null;
  }

  const appliedFilters = filters.filter((filter) => filter.value.trim());

  return createPortal(
    <div
      data-print-root
      role={isOpen ? "dialog" : undefined}
      aria-modal={isOpen ? true : undefined}
      aria-label={isOpen ? "Print preview" : undefined}
      className={isOpen ? "fixed inset-0 z-[100] flex flex-col bg-slate-700/90 print:static print:block print:bg-white" : "hidden print:block"}
    >
      {isOpen ? (
        <div className="flex shrink-0 items-center justify-between gap-3 bg-white px-4 py-3 shadow-md print:hidden">
          <p className="text-sm font-semibold text-slate-900">Print preview</p>

          <div className="flex items-center gap-2">
            <button
              ref={printButtonRef}
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#4c8cc9] px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors cursor-pointer hover:bg-[#3f7ab5]"
            >
              <Printer size={16} aria-hidden="true" />
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors cursor-pointer hover:bg-slate-50"
            >
              <X size={16} aria-hidden="true" />
              Close
            </button>
          </div>
        </div>
      ) : null}

      <div className={cn(isOpen && "min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-6 sm:py-6 print:overflow-visible print:p-0")}>
        <article
          className={cn(
            "mx-auto bg-white text-[13px] leading-5 text-slate-900",
            isOpen && "max-w-[8.5in] px-5 py-6 shadow-xl sm:px-[0.7in] sm:py-[0.6in] print:max-w-none print:p-0 print:shadow-none",
          )}
        >
          <header className="mb-4 border-b-2 border-slate-800 pb-3">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">BIRD · Boston Immigrant Resource Dashboard</p>
                <h1 className="mt-0.5 text-xl font-semibold tracking-tight">{title}</h1>
              </div>
              <p className="shrink-0 text-[11px] text-slate-500">Printed {printedOn}</p>
            </div>

            <p className="mt-2 font-medium">{countText}</p>
            <p className="mt-1 text-[12px] text-slate-600">
              {appliedFilters.length > 0
                ? appliedFilters.map((filter, index) => (
                    <span key={filter.label}>
                      {index > 0 ? " · " : ""}
                      <span className="font-medium text-slate-800">{filter.label}:</span> {filter.value}
                    </span>
                  ))
                : "No search or filters applied"}
            </p>
          </header>

          <ul className="m-0 list-none p-0">{children}</ul>

          <footer className="mt-5 border-t border-slate-300 pt-2 text-[11px] text-slate-500">birdboston.org</footer>
        </article>
      </div>
    </div>,
    document.body,
  );
}
