/**
 * ENV CONFIGURATION TESTS - Phase 4
 *
 * These tests verify deterministic TRUST_PROXY parsing behavior.
 *
 * Security requirements:
 * - TRUST_PROXY=true must be REJECTED
 * - Negative values must be REJECTED
 * - Only explicit hop counts or IP/subnet notation allowed
 *
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { parseTrustProxy } from '../env';

describe('TRUST_PROXY Configuration', () => {
  describe('TRUST_PROXY unset', () => {
    it('should default to 0 when TRUST_PROXY is unset', () => {
      const result = parseTrustProxy(undefined);
      expect(result).toBe(0);
      expect(typeof result).toBe('number');
    });
  });

  describe('TRUST_PROXY=0', () => {
    it('should parse "0" as number 0', () => {
      const result = parseTrustProxy('0');
      expect(result).toBe(0);
      expect(typeof result).toBe('number');
    });
  });

  describe('TRUST_PROXY=1', () => {
    it('should parse "1" as number 1', () => {
      const result = parseTrustProxy('1');
      expect(result).toBe(1);
      expect(typeof result).toBe('number');
    });
  });

  describe('TRUST_PROXY=2', () => {
    it('should parse "2" as number 2', () => {
      const result = parseTrustProxy('2');
      expect(result).toBe(2);
      expect(typeof result).toBe('number');
    });
  });

  describe('TRUST_PROXY=false', () => {
    it('should parse "false" as boolean false', () => {
      const result = parseTrustProxy('false');
      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('TRUST_PROXY=true', () => {
    it('should REJECT "true" and throw error', () => {
      expect(() => {
        parseTrustProxy('true');
      }).toThrow('TRUST_PROXY=true is not allowed');
    });
  });

  describe('Invalid negative values', () => {
    it('should REJECT negative hop count "-1"', () => {
      expect(() => {
        parseTrustProxy('-1');
      }).toThrow('Negative hop counts are not allowed');
    });

    it('should REJECT negative hop count "-5"', () => {
      expect(() => {
        parseTrustProxy('-5');
      }).toThrow('Negative hop counts are not allowed');
    });
  });

  describe('Valid IP/subnet notation', () => {
    it('should pass through valid subnet notation to Express', () => {
      const result = parseTrustProxy('loopback, 123.45.67.89');
      expect(result).toBe('loopback, 123.45.67.89');
      expect(typeof result).toBe('string');
    });

    it('should pass through valid single IP to Express', () => {
      const result = parseTrustProxy('10.0.0.1');
      expect(result).toBe('10.0.0.1');
      expect(typeof result).toBe('string');
    });
  });

  describe('Empty string', () => {
    it('should treat empty string as unset (default to 0)', () => {
      const result = parseTrustProxy('');
      expect(result).toBe(0);
    });
  });

  describe('Null value', () => {
    it('should treat null as unset (default to 0)', () => {
      const result = parseTrustProxy(null);
      expect(result).toBe(0);
    });
  });
});
