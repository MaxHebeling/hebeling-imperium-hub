import { randomUUID } from "node:crypto";

export function createFoundationId(): string {
  return randomUUID();
}

export function createFoundationTimestamp(): string {
  return new Date().toISOString();
}
