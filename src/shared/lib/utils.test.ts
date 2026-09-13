import { describe, expect, it } from 'vitest';

import { cleanServerMessage } from './utils';

describe('cleanServerMessage', () => {
  it('strips leading requirement codes from server messages', () => {
    expect(cleanServerMessage('RN-05: work order is awaiting spare parts and cannot be concluded')).toBe('work order is awaiting spare parts and cannot be concluded');
    expect(cleanServerMessage('HU-09: customer approved the finding')).toBe('customer approved the finding');
    expect(cleanServerMessage('US-20: settlement loaded')).toBe('settlement loaded');
    expect(cleanServerMessage('FE-04: forbidden')).toBe('forbidden');
    expect(cleanServerMessage('BE-24: query failed')).toBe('query failed');
  });

  it('strips codes wrapped in parentheses even at the end of a sentence', () => {
    expect(cleanServerMessage('Order resumes repair (US-21).')).toBe('Order resumes repair.');
  });

  it('strips inline codes and normalizes duplicate whitespace', () => {
    expect(cleanServerMessage('work order   reserved (RN-07)   today')).toBe('work order reserved today');
  });

  it('keeps plain user-facing messages unchanged', () => {
    expect(cleanServerMessage('El vehículo fue entregado')).toBe('El vehículo fue entregado');
  });

  it('returns empty string for empty or non-string input', () => {
    expect(cleanServerMessage('')).toBe('');
    expect(cleanServerMessage(undefined)).toBe('');
    expect(cleanServerMessage(42 as unknown as string)).toBe('');
  });

  it('does not strip codes that are part of regular words', () => {
    expect(cleanServerMessage('Uso de taller reservado')).toBe('Uso de taller reservado');
  });
});