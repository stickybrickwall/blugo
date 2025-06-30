import { useNavigate } from 'react-router-dom';
import { getUserFromToken } from '../utils/getUserFromTokens';

export const useReturnToHome = () => {
  const navigate = useNavigate();

  return (firstName?: string, lastName?: string) => {
    const user = getUserFromToken();
    if (!user) {
      alert('You are not logged in.');
      navigate('/login');
      return;
    }

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