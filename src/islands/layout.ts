/**
 * Island layout helpers, shared by every island.
 *
 * The focus camera looks at an island from the front right, about 54° from +X and about
 * 19° down. Islands lay their objects out in two rows across that view (see
 * docs/plan/islands/radio.md, section 4): tall things in a back row, the rest in a front
 * row about 5 m closer, each front object in its own column. Because the camera looks
 * down, the front row shows below the back row on screen, so nothing hides anything.
 */

/** Turn that makes a model's front (+Z) face the focus camera, in degrees. */
export const FACE_CAMERA = 54;

/**
 * Island x and z for a spot given as "across the view" (+ is the visitor's right) and
 * "towards the camera" (+ is closer). Both in island units.
 */
export const view = (across: number, towards: number): [number, number] => [
  +(0.59 * across + 0.8 * towards).toFixed(2),
  +(-0.8 * across + 0.59 * towards).toFixed(2),
];

export const deg = (d: number) => (d * Math.PI) / 180;
