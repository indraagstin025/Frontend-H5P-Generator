/** Scoped logger agar console konsisten antar feature (ala WeSign utils/logger). */
export function createLogger(scope: string) {
  const prefix = `[${scope}]`;
  return {
    info: (...args: unknown[]) => console.info(prefix, ...args),
    warn: (...args: unknown[]) => console.warn(prefix, ...args),
    error: (...args: unknown[]) => console.error(prefix, ...args),
  };
}
