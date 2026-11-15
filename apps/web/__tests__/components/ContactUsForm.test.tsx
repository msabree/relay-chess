import { act, fireEvent, render, screen } from '@testing-library/react';
import ContactUsForm from '@/components/ContactUsForm';
import { contactUs, getContactChallenge } from '@/apis/auth';

jest.mock('@/apis/auth', () => ({
  contactUs: jest.fn(() => Promise.resolve()),
  getContactChallenge: jest.fn(() => Promise.resolve({ token: 'tok', question: 'What is 3 + 4?' })),
}));

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Send message' })));
const ready = () => screen.findByLabelText('Quick check: What is 3 + 4?');

describe('ContactUsForm', () => {
  beforeEach(() => {
    (contactUs as jest.Mock).mockReset().mockImplementation(() => Promise.resolve());
    (getContactChallenge as jest.Mock).mockClear();
  });

  it('shows zod errors and does not submit invalid input', async () => {
    render(<ContactUsForm />);
    await ready();
    type('Email', 'nope');
    type('Message', 'asdkjfhaskdjfh sdkfjh');
    await submit();
    expect(screen.getByText('Please enter your name.')).toBeTruthy();
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
    expect(screen.getByText("That doesn't look like a real message. A sentence or two helps us help you.")).toBeTruthy();
    expect(screen.getByText('Please answer the question.')).toBeTruthy();
    expect(contactUs).not.toHaveBeenCalled();

    // errors clear as fields are fixed
    type('Name', 'Ann');
    expect(screen.queryByText('Please enter your name.')).toBeNull();
  });

  it('submits trimmed values with the captcha answer', async () => {
    render(<ContactUsForm />);
    await ready();
    type('Name', ' Ann ');
    type('Email', 'a@b.co');
    type('Message', 'The board froze after a move.');
    type(/Quick check/, ' 7 ');
    await submit();
    expect(contactUs).toHaveBeenCalledWith({ name: 'Ann', email: 'a@b.co', message: 'The board froze after a move.' }, { token: 'tok', answer: '7' }, '');
    expect(screen.getByText('Message sent')).toBeTruthy();
  });

  it('a wrong answer says so and brings a new question', async () => {
    (contactUs as jest.Mock).mockImplementation(() =>
      Promise.reject(Object.assign(new Error('400'), { isAxiosError: true, response: { status: 400, data: { error: 'captcha' } } })),
    );
    render(<ContactUsForm />);
    await ready();
    type('Name', 'Ann');
    type('Email', 'a@b.co');
    type('Message', 'The board froze after a move.');
    type(/Quick check/, '9');
    await submit();
    expect(screen.getByText("That's not quite right. Here's a new one.")).toBeTruthy();
    expect(getContactChallenge).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Message sent')).toBeNull();
  });
});
