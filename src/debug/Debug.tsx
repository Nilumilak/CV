import { Perf } from 'r3f-perf';

/** Rendered inside the Canvas only when ?debug is in the address. */
export default function Debug() {
  return <Perf position="top-left" />;
}
