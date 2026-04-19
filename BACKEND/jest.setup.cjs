/**
 * Jest runs many suites that import aws-sdk (storage). Suppress the v2 end-of-support
 * NOTE spam so real failures are visible.
 */
const origEmit = process.emitWarning.bind(process);
process.emitWarning = (warning, type, code, ctor) => {
  const msg = typeof warning === 'string' ? warning : warning?.message ?? '';
  if (msg.includes('AWS SDK for JavaScript (v2)') && msg.includes('end-of-support')) {
    return;
  }
  return origEmit(warning, type, code, ctor);
};
