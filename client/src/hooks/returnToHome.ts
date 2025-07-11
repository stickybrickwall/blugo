import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../utils/getUserFromTokens';

export const useReturnToHome = () => {
  const navigate = useNavigate();

  return () => {
    const user = getUserFromToken();
    if (!user) {
      alert('You are not logged in.');
      navigate('/login');
      return;
    }

    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';

    navigate('/home', {
      state: {
        userId: user.id,
        email: user.email,
        firstName,
        lastName
      },
    });
  };
};