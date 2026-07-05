"use client";
import type { StealthKeys } from "./stealth";

const KEY = "veil.stealthKeys.v1";

export function saveKeys(keys: StealthKeys) {
  localStorage.setItem(KEY, JSON.stringify(keys));
}
export function loadKeys(): StealthKeys | null {
  const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
  return raw ? (JSON.parse(raw) as StealthKeys) : null;
}
export function clearKeys() {
  localStorage.removeItem(KEY);
}
