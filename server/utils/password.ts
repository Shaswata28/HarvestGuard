import bcrypt from 'bcrypt';

/**
 * Number of salt rounds for bcrypt hashing
 * Higher values = more secure but slower
 */
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt
 * @param plaintext - The plaintext password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a hash
 * @param plaintext - The plaintext password to verify
 * @param hash - The hash to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
