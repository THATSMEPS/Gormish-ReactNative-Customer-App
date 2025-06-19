import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthTokenHandlerProps {
  embedded: boolean;
}

// Helper function to get cookie value by name
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

export const AuthTokenHandler = ({ embedded }: AuthTokenHandlerProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!embedded) {
      return;
    }

    // Read auth_token and customerId from cookies
    const token = getCookie('auth_token');
    const userId = getCookie('customerId');
    const userData = getCookie('customerData'); // Assuming customerData might be stored as cookie JSON string

    if (token) {
      // Store token and user info in localStorage
      localStorage.setItem('authToken', token);
      if (userData) {
        try {
          localStorage.setItem('customerData', userData);
        } catch (e) {
          console.error("Error storing customerData from cookie:", e);
        }
      } else if (userId) {
        // Fallback: store customerId inside a minimal customerData object
        localStorage.setItem('customerData', JSON.stringify({ id: userId }));
      }
      localStorage.setItem('expiresAt', (Math.floor(Date.now() / 1000) + 3600).toString()); // 1 hour expiry example

      // Clean URL if needed
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // Navigate to main app page
      navigate('/');
    }
  }, [embedded, navigate]);

  return null;
};
