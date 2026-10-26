import { describe, expect, it } from 'vitest';
import { contactErrors, contactSchema } from '../src';

describe('contact schema', () => {
  it('accepts and trims a valid message', () => {
    expect(contactSchema.parse({ name: ' Ann ', email: 'a@b.co ', message: ' hi ' })).toEqual({ name: 'Ann', email: 'a@b.co', message: 'hi' });
    expect(contactErrors({ name: 'Ann', email: 'a@b.co', message: 'hi' })).toBeNull();
  });

  it('reports one message per bad field', () => {
    expect(contactErrors({ name: '  ', email: 'nope', message: '' })).toEqual({
      name: 'Please enter your name.',
      email: 'Enter a valid email address.',
      message: 'Please enter a message.',
    });
    expect(contactErrors({ name: 'A', email: '', message: 'x'.repeat(5001) })).toEqual({
      email: 'Please enter your email.',
      message: 'Keep your message under 5,000 characters.',
    });
  });
});
