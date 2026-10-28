/** Shared UI sizes. The camera rig uses them to keep the focused island out from under the panel. */
export const PANEL_WIDTH = 440;
/** Below this width the panel becomes a bottom sheet. */
export const MOBILE_BREAKPOINT = 768;
/** Bottom sheet height as a share of the screen at its default (half) position. */
export const SHEET_SHARE = 0.55;

export const isMobileWidth = (width: number) => width < MOBILE_BREAKPOINT;
