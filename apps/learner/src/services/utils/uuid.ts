/**
 * UUID Utility Functions
 *
 * Provides UUID v4 generation without external dependencies.
 * Uses crypto.randomUUID() when available, with a Math.random() fallback.
 *
 * @module utils/uuid
 */

/**
 * Validates that a string is a valid UUID v4 format.
 *
 * @param value - The value to validate
 * @returns True if the value is a valid UUID v4 string
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Generates a random UUID v4 string.
 *
 * Uses the native crypto.randomUUID() API when available (modern browsers).
 * Falls back to a Math.random()-based implementation for older environments.
 *
 * @returns A UUID v4 string
 *
 * @example
 * ```ts
 * const id = generateUUID();
 * // Returns: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * ```
 */
export function generateUUID(): string {
  // Use native crypto API if available (preferred)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates a UUID or validates an existing ID.
 *
 * If the provided ID is a valid UUID, it is returned as-is.
 * Otherwise, a new UUID is generated.
 *
 * @param id - Optional existing ID to validate
 * @returns A valid UUID v4 string
 */
export function ensureUUID(id?: string): string {
  if (id && isValidUUID(id)) {
    return id;
  }
  return generateUUID();
}

/**
 * Generates a short ID for non-sensitive use cases.
 *
 * This is a shorter ID format (8 characters) suitable for
 * temporary identifiers where collision risk is acceptable.
 *
 * @returns A short ID string
 */
export function generateShortId(): string {
  return Math.random().toString(36).slice(2, 10);
}
