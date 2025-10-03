export const IS_DEMO = (process.env.REACT_APP_DEMO || 'true') === 'true';

export const DEMO_LATENCY_MS = 300;

export const simulateLatency = async <T>(value: T, delayMs: number = DEMO_LATENCY_MS): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(value), delayMs));


