import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:5000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);

                navigate('/home', {
                    state: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email
                    }
                });
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong during login');
        }
    };

    return (
        <div className="relative w-full min-h-screen overflow-x-hidden font-poppins text-primary">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-[url('/blugo/blue-gradient.jpg')] bg-cover bg-center opacity-30 z-0"
                aria-hidden="true"
            />
            {/* Foreground Content */}
            <div className="relative z-10 flex flex-col items-center min-h-screen px-4 pt-16">
                <img src="/blugo/logo.png" alt="GlowGuide Logo" className="w-full max-w-[400px]" />
                <div className="bg-white rounded-xl mt-8 p-6 shadow-md w-full max-w-sm">
                    <h2 className="text-[#547fac] font-semibold text-center tracking-widest font-[Nunito] text-1xl mb-4">
                        Log In to Existing Account
                    </h2>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="p-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f628e]"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="p-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f628e]"
                        />
                        <button 
                            type="submit"
                            className="bg-[#1f628e] text-white font-medium px-6 py-3 rounded-md hover:opacity-90 transition"
                        >
                            Login
                        </button>
                    </form>
                    <p className="mt-4 text-sm text-center font-nunito">
                        Don't have an account? <Link to="/signup" className="text-[#1f628e] font-semibold underline">Signup here!</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
