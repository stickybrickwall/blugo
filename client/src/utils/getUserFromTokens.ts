import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export const getUserFromToken = (): TokenPayload | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return jwtDecode<TokenPayload>(token);
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }
};