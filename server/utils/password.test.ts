import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('Password utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const plaintext = 'mySecurePassword123';
      const hash = await hashPassword(plaintext);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plaintext);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password', async () => {
      const plaintext = 'samePassword';
      const hash1 = await hashPassword(plaintext);
      const hash2 = await hashPassword(plaintext);

      // bcrypt uses random salts, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const plaintext = 'correctPassword';
      const hash = await hashPassword(plaintext);

      const isValid = await verifyPassword(plaintext, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const plaintext = 'correctPassword';
      const hash = await hashPassword(plaintext);

      const isValid = await verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const plaintext = 'correctPassword';
      const hash = await hashPassword(plaintext);

      const isValid = await verifyPassword('', hash);

      expect(isValid).toBe(false);
    });
  });
});
