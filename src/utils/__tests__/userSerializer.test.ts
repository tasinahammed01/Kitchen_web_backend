/**
 * SECURITY TEST: User Serializer Verification
 *
 * This test verifies that the user serializer only exposes safe fields.
 * Private fields like passwordHash must never leak.
 */

import { describe, it, expect } from 'vitest';
import { toPublicUser } from '../userSerializer';

const mockUserWithPrivateData = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test User',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpasswordthatmustnotleak',
  role: 'customer' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  futurePrivateAuthField: 'MUST_NOT_LEAK',
  loginPasswordHistory: ['old1', 'old2'],
  paymentTokens: ['stripe_token_123'],
};

describe('User Serializer Security', () => {
  it('should not expose passwordHash', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect('passwordHash' in publicUser).toBe(false);
  });

  it('should not expose future private field (allowlist working)', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect('futurePrivateAuthField' in publicUser).toBe(false);
  });

  it('should not expose loginPasswordHistory', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect('loginPasswordHistory' in publicUser).toBe(false);
  });

  it('should not expose paymentTokens', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect('paymentTokens' in publicUser).toBe(false);
  });

  it('should expose required public fields', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    const requiredPublicFields = ['id', 'name', 'email', 'role', 'createdAt'];

    for (const field of requiredPublicFields) {
      expect(field in publicUser).toBe(true);
    }
  });

  it('should not expose isActive (internal only)', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect('isActive' in publicUser).toBe(false);
  });

  it('should not leak unknown fields (strict allowlist)', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    const publicKeys = Object.keys(publicUser);
    const knownPublicFields = ['id', 'name', 'email', 'role', 'createdAt'];

    const unknownFields = publicKeys.filter(key => !knownPublicFields.includes(key));
    expect(unknownFields.length).toBe(0);
  });

  it('should correctly convert _id to id', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect(publicUser.id).toBe('507f1f77bcf86cd799439011');
  });

  it('should have valid enum role value', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect(publicUser.role === 'customer' || publicUser.role === 'admin').toBe(true);
  });

  it('should have ISO string createdAt', () => {
    const publicUser = toPublicUser(mockUserWithPrivateData as any);
    expect(typeof publicUser.createdAt).toBe('string');
  });
});
