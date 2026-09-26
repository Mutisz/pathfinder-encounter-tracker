export type Rng = (sides: number) => number;

/** Uniform integer in [1, sides] using the Web Crypto API when available. */
export const secureRoll: Rng = (sides) => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x1_0000_0000 / sides) * sides;
    let n: number;
    do {
      crypto.getRandomValues(buf);
      n = buf[0];
    } while (n >= limit);
    return (n % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
};

export const d20 = (rng: Rng = secureRoll): number => rng(20);

export const createId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
