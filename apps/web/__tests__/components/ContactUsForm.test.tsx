import { act, fireEvent, render, screen } from '@testing-library/react';
import ContactUsForm from '@/components/ContactUsForm';
import { contactUs } from '@/apis/auth';

jest.mock('@/apis/auth', () => ({ contactUs: jest.fn(() => Promise.resolve()) }));

const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => act(async () => void fireEvent.click(screen.getByRole('button', { name: 'Send Message' })));

describe('ContactUsForm', () => {
  beforeEach(() => (contactUs as jest.Mock).mockClear());

  it('shows zod errors and does not submit invalid input', async () => {
    render(<ContactUsForm />);
    type('Your Email', 'nope');
    await submit();
    expect(screen.getByText('Please enter your name.')).toBeTruthy();
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
    expect(screen.getByText('Please enter a message.')).toBeTruthy();
    expect(contactUs).not.toHaveBeenCalled();

    // errors clear as fields are fixed
    type('Your Name', 'Ann');
    expect(screen.queryByText('Please enter your name.')).toBeNull();
  });

  it('submits trimmed values when valid', async () => {
    render(<ContactUsForm />);
    type('Your Name', ' Ann ');
    type('Your Email', 'a@b.co');
    type('Your Message', 'hello');
    await submit();
    expect(contactUs).toHaveBeenCalledWith('Ann', 'a@b.co', 'hello');
    expect(screen.getByText('Message Sent!')).toBeTruthy();
  });
});
