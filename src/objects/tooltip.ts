let element: HTMLElement | null = null;
/** Which object the tooltip is showing for. */
let owner: string | null = null;

/** Called by ObjectTooltip with its element. */
export function registerTooltip(el: HTMLElement | null) {
  element = el;
}

/**
 * One shared hover hint for interactive objects. It follows the pointer, and its
 * position is written straight to the element, so pointer moves never re-render React.
 * Mouse-only: keyboard users reach the same objects through the panel's "Show me" buttons.
 */
export const tooltip = {
  show(id: string, text: string, x: number, y: number) {
    if (!element) return;
    owner = id;
    element.textContent = text;
    element.dataset.visible = 'true';
    tooltip.move(x, y);
  },
  move(x: number, y: number) {
    if (element) element.style.transform = `translate(${x}px, ${y}px)`;
  },
  /**
   * Hides the hint only if this object still owns it. Moving straight from one object
   * to the next runs the old object's hide after the new one's show.
   */
  hide(id: string) {
    if (!element || owner !== id) return;
    owner = null;
    element.dataset.visible = 'false';
  },
};
