import { randomInt } from "node:crypto";

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%&*_-+=";
const ALL = LOWER + UPPER + DIGITS + SYMBOLS;

function pick(pool: string) {
  return pool[randomInt(pool.length)]!;
}

function shuffle(chars: string[]) {
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars;
}

export function generateTemporaryPassword(length = 16) {
  const size = Math.max(length, 12);
  const chars = shuffle([pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS), ...Array.from({ length: size - 4 }, () => pick(ALL))]);
  return chars.join("");
}
