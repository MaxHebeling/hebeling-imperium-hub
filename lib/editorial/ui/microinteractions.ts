/**
 * Microinteractions utility classes and helpers for Hebeling OS Design System.
 *
 * These CSS class strings can be applied to components for consistent
 * hover, transition, skeleton, and elevation effects across the platform.
 */

/** Card hover elevation effect */
export const CARD_HOVER_ELEVATION =
  "transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20";

/** Subtle card hover */
export const CARD_HOVER_SUBTLE =
  "transition-all duration-150 ease-out hover:shadow-md hover:bg-muted/30";

/** Button press effect */
export const BUTTON_PRESS =
  "transition-transform duration-100 active:scale-[0.97]";

/** Fade in animation */
export const FADE_IN =
  "animate-in fade-in duration-300";

/** Slide up animation */
export const SLIDE_UP =
  "animate-in slide-in-from-bottom-2 duration-300";

/** Slide in from right */
export const SLIDE_RIGHT =
  "animate-in slide-in-from-right-2 duration-200";

/** Scale in animation */
export const SCALE_IN =
  "animate-in zoom-in-95 duration-200";

/** Skeleton pulse for loading states */
export const SKELETON_PULSE =
  "animate-pulse bg-muted rounded-md";

/** Skeleton shimmer effect (use with after pseudo) */
export const SKELETON_SHIMMER =
  "relative overflow-hidden bg-muted rounded-md before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

/** Badge pulse for active/live indicators */
export const BADGE_PULSE =
  "relative after:absolute after:inset-0 after:rounded-full after:animate-ping after:bg-current after:opacity-20";

/** Smooth expand/collapse */
export const COLLAPSE_TRANSITION =
  "transition-all duration-300 ease-in-out overflow-hidden";

/** Row hover for lists/tables */
export const ROW_HOVER =
  "transition-colors duration-150 hover:bg-muted/50 cursor-pointer";

/** Icon rotate on hover (parent needs group class) */
export const ICON_ROTATE_HOVER =
  "transition-transform duration-200 group-hover:rotate-12";

/** Staggered children animation delay classes */
export const STAGGER_DELAYS = [
  "delay-0",
  "delay-75",
  "delay-100",
  "delay-150",
  "delay-200",
  "delay-300",
  "delay-500",
  "delay-700",
] as const;

/** Glass morphism effect for overlays */
export const GLASS_EFFECT =
  "backdrop-blur-md bg-background/80 border border-border/50";

/** Gold accent glow (Hebeling OS brand) */
export const GOLD_GLOW =
  "shadow-[0_0_15px_rgba(200,167,91,0.15)]";

/** Maroon crest accent border */
export const MAROON_BORDER =
  "border-l-2 border-l-[#6E1F2F]";

/** Surface card with Hebeling OS styling */
export const HEBELING_SURFACE =
  "bg-[#162235] border-[#1e2d45] text-[#E8E0D0]";

/**
 * Generate skeleton placeholder classes for a specific element type.
 */
export function skeletonFor(type: "text" | "avatar" | "card" | "button" | "badge"): string {
  switch (type) {
    case "text":
      return `${SKELETON_PULSE} h-4 w-3/4`;
    case "avatar":
      return `${SKELETON_PULSE} h-10 w-10 rounded-full`;
    case "card":
      return `${SKELETON_PULSE} h-32 w-full`;
    case "button":
      return `${SKELETON_PULSE} h-9 w-24 rounded-md`;
    case "badge":
      return `${SKELETON_PULSE} h-5 w-16 rounded-full`;
    default:
      return SKELETON_PULSE;
  }
}

/**
 * Generate a staggered delay class for animated lists.
 * @param index - The index of the item in the list
 * @param baseDelay - Base delay in ms (default 50)
 */
export function staggerDelay(index: number, baseDelay = 50): string {
  const delay = index * baseDelay;
  return `animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-backwards`;
}

/**
 * Combine multiple class strings, filtering out falsy values.
 */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
