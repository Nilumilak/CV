import { registerTooltip } from './tooltip';
import styles from './ObjectTooltip.module.css';

/** The element behind `tooltip` (see tooltip.ts). Rendered once, in the overlay. */
export function ObjectTooltip() {
  return (
    <div ref={registerTooltip} className={styles.tooltip} data-visible="false" aria-hidden="true" />
  );
}
