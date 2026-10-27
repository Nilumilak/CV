/** Debug tools (leva, r3f-perf) are enabled by adding ?debug to the address. */
export const isDebug = new URLSearchParams(window.location.search).has('debug');
