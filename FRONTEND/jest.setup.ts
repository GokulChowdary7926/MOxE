// Enable React 18 act() environment flag for createRoot-based tests.
// This suppresses false-positive act warnings in Jest + jsdom.
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
