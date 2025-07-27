import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReturnToHome } from '../hooks/returnToHome';
import { getUserFromToken } from '../utils/getUserFromTokens';

function Account() {
  const navigate = useNavigate();
  const returnToHome = useReturnToHome();

  const [userInfo, setUserInfo] = useState({
    id: '',
    email: '',
    fullName: ''
  });

  useEffect(() => {
    const user = getUserFromToken();
    const firstName = localStorage.getItem('firstName') || '';
    const lastName = localStorage.getItem('lastName') || '';

    if (user) {
      setUserInfo({
        id: String(user.id),
        email: user.email,
        fullName: `${firstName} ${lastName}`.trim()
      });
    } else {
      alert('You are not logged in.');
      navigate('/login');
    }
  }, [navigate]);

  const handleChangePassword = async () => {
    const oldPassword = prompt('Enter your current password:');
    if (!oldPassword) return;
    const newPassword = prompt('Enter your new password:');
    if (!oldPassword) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://glowguide-lqx9.onrender.com/account/change-password', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ oldPassword, newPassword })
        });

        if (res.status === 204) {
            alert('Password changed successfully.');
            } else {
            const data = await res.json();
            throw new Error(data.error);
            }

    } catch (err) {
        alert(`Failed to change password: ${(err as Error).message}`);
    }
    };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmed) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://glowguide-lqx9.onrender.com/account', {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
        });

        if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
        }

        alert('Account deleted.');
        localStorage.clear();
        navigate('/');
    } catch (err) {
        alert(`Failed to delete account: ${(err as Error).message}`);
    }
    };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen bg-background text-[#1f628e] font-poppins flex flex-col">
      {/* Background Layer */}
      <div
        className="absolute inset-0 bg-[url('/blugo/blue-gradient.jpg')] bg-cover bg-center opacity-20 z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md font-nunito">
          <div className="flex items-center">
            <img src="/blugo/logo.png" alt="GlowGuide Logo" className="w-[150px]" />
          </div>
          <div className="flex gap-4">
            <button
              onClick={returnToHome}
              className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
            >
              Home
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-grow flex flex-col items-center pt-16 px-4 pb-32 font-poppins">
          <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-xl space-y-6">
            <h2 className="text-3xl font-semibold text-2xl text-center">Account Settings</h2>

            <div className="divide-y divide-gray-200">
                {[
                    { label: 'Name', value: userInfo.fullName },
                    { label: 'Email', value: userInfo.email },
                    { label: 'User ID', value: userInfo.id },
                ].map((item, i) => (
                    <div key={i} className="flex justify-between py-2 text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-gray-800 text-right">{item.value}</span>
                    </div>
                ))}
            </div>

            <div className="pt-6 space-y-3">
              <button 
                onClick={handleChangePassword}
                className="font-light w-full bg-white text-gray-700 px-4 py-2 rounded-md hover:scale-105 transition-transform transform"
              >
                Change Password
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="font-light w-full bg-white text-gray-700 px-4 py-2 rounded-md hover:scale-105 transition-transform transform"
              >
                Delete Account
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:scale-105 transition-transform transform"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;