"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// The widest a filter drop-down gets (24rem): a longer option name wraps onto more lines instead of making the panel wider.
const MAX_WIDTH_PX = 384;
// The narrowest it is allowed to be (the min-w-60 on the panel), unless there isn't even that much room.
const MIN_WIDTH_PX = 240;
// How much room it keeps from the edges of the page.
const EDGE_GAP_PX = 12;
// If the preferred side has less room than this, and the other side has more, it opens toward the other side.
const COMFORTABLE_WIDTH_PX = 320;

type DropdownPanelProps = {
  /** Which edge of its button the panel lines up with, when there is room on that side. */
  preferredSide: "left" | "right";
  /** Changes whenever the button's text can change (so its width and position can), so the panel is placed again. */
  placementKey: string;
  className: string;
  children: ReactNode;
};

/**
 * The panel of a filter drop-down. On its own the panel is as wide as its longest option and lines up with one edge of its button,
 * so a long option name made it stretch past the other edge of the screen, or underneath the sidebar, where it was cut off. This
 * keeps it between the left edge of the page content (the sidebar's right edge, or the window's when there is no sidebar) and the
 * right edge of the window: it limits the panel's width to the room on the side it opens toward, and opens toward the other side
 * when its preferred one is too tight. Below the sm breakpoint the panel is as wide as the whole row of filters rather than
 * lined up with its button, and it already fits, so it is left alone.
 */
export function DropdownPanel({ preferredSide, placementKey, className, children }: DropdownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchor = panel?.parentElement;
    if (!panel || !anchor) return;

    function place() {
      if (!panel || !anchor) return;

      if (getComputedStyle(anchor).position !== "relative") {
        panel.style.removeProperty("max-width");
        panel.style.removeProperty("min-width");
        panel.style.removeProperty("left");
        panel.style.removeProperty("right");
        return;
      }

      // The page content starts where the sidebar ends, so its left edge is the left limit.
      const page = anchor.closest("main")?.getBoundingClientRect();
      const leftLimit = (page?.left ?? 0) + EDGE_GAP_PX;
      const rightLimit = Math.min(window.innerWidth, page?.right ?? window.innerWidth) - EDGE_GAP_PX;
      const button = anchor.getBoundingClientRect();

      const room = { left: rightLimit - button.left, right: button.right - leftLimit };
      const otherSide = preferredSide === "right" ? "left" : "right";
      const side = room[preferredSide] < COMFORTABLE_WIDTH_PX && room[otherSide] > room[preferredSide] ? otherSide : preferredSide;

      const maxWidth = Math.max(0, Math.min(MAX_WIDTH_PX, room[side]));
      panel.style.maxWidth = `${maxWidth}px`;
      panel.style.minWidth = `${Math.min(MIN_WIDTH_PX, maxWidth)}px`;
      panel.style.left = side === "left" ? "0px" : "auto";
      panel.style.right = side === "right" ? "0px" : "auto";
    }

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [preferredSide, placementKey]);

  return (
    <div ref={panelRef} className={className}>
      {children}
    </div>
  );
}
