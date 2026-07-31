import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage.jsx';
import { AuthContext } from '../contexts/AuthContext.jsx';

const renderWithAuth = (value) =>
  render(
    <AuthContext.Provider value={value}>
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    </AuthContext.Provider>
  );

describe('HomePage', () => {
  it('shows login and register when unauthenticated', () => {
    renderWithAuth({ isAuthenticated: false });

    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /register/i })).toBeInTheDocument();
  });

  it('shows dashboard when authenticated', () => {
    renderWithAuth({ isAuthenticated: true });

    expect(screen.getByRole('link', { name: /go to dashboard/i })).toBeInTheDocument();
  });
});
