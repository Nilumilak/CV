/**
 * The white "inside the cloud" veil is a DOM element over the canvas.
 * FlyIn writes its opacity every frame, so React never re-renders during the dive.
 */
let veil: HTMLElement | null = null;

export function registerVeil(el: HTMLElement | null) {
  veil = el;
}

export function setVeilOpacity(opacity: number) {
  if (veil) veil.style.opacity = opacity.toFixed(3);
}
