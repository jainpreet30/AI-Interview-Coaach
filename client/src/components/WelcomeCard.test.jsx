import { render, screen } from '@testing-library/react';
import WelcomeCard from './WelcomeCard.jsx';

describe('WelcomeCard', () => {
  it('renders the welcome title and feature list', () => {
    render(<WelcomeCard />);

    expect(screen.getByRole('heading', { name: /AI Interview Coach/i })).toBeInTheDocument();
    expect(screen.getByText(/AI-powered mock sessions/i)).toBeInTheDocument();
    expect(screen.getByText(/Express API/i)).toBeInTheDocument();
  });
});
