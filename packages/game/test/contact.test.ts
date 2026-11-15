import { describe, expect, it } from 'vitest';
import { contactErrors, contactSchema, looksLikeGibberish } from '../src';

describe('contact schema', () => {
  it('accepts and trims a valid message', () => {
    expect(contactSchema.parse({ name: ' Ann ', email: 'a@b.co ', message: ' hi there, love it ' })).toEqual({ name: 'Ann', email: 'a@b.co', message: 'hi there, love it' });
    expect(contactErrors({ name: 'Ann', email: 'a@b.co', message: 'The board froze after a move.' })).toBeNull();
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

  it('asks for a bit more than a word', () => {
    expect(contactErrors({ name: 'A', email: 'a@b.co', message: 'hi' })?.message).toBe('Tell us a little more (at least 10 characters).');
  });
});

describe('gibberish check', () => {
  const real = [
    'The board froze after my teammate moved.',
    'Bug: rematch does nothing on iPhone 15 Pro',
    'Love the 2v2 idea!! can you add 3+2 blitz?',
    'Check https://www.relaychess.com/games/xYz123AbC please',
    "TypeError: Cannot read properties of undefined (reading 'moves')",
    'El tablero se congela después de cada jugada.',
    'Das Brett friert nach jedem Zug ein, bitte prüfen.',
    'Хорошая игра, но таймер иногда зависает',
    '棋盘在移动后卡住了，请修复',
    'ok so rhythm and myths are hard words lol',
    'Reached out at mike.smith@example.com about sponsorship',
  ];
  const mash = [
    'asdkjfhaskdjfh sdkfjh',
    'sdfghjkl qwrtyp zxcvbnm',
    'aaaaaaaaaaaa',
    'hiiiiiiiiii there',
    'kjhsdfkjhsdfkjhsdfkjhsdfkjhsdf',
    '!!!!!!!! ????? 1234567',
    'fgjhfgjhfgjhfgjh fgjhfgjh',
  ];
  it.each(real)('lets real messages through: %s', (m) => expect(looksLikeGibberish(m)).toBe(false));
  it.each(mash)('stops keyboard mashing: %s', (m) => expect(looksLikeGibberish(m)).toBe(true));
});
