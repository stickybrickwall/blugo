import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:5000/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, firstName, lastName })
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
                alert(data.error || 'Signup failed');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong during signup');
        }
    };

    return (
        <div className="min-h-screen bg-background m-0 p-0 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-6 px-4">
        <img src="/blugo/logo.png" alt="GlowGuide Logo" className="w-full max-w-[400px]" />
        <div className="bg-white rounded-xl mt-8 p-6 shadow-md w-full max-w-sm">
            <h2 className="text-[#547fac] font-semibold text-center tracking-widest font-nunito text-1xl mb-4">
                Create a New Account
            </h2>
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="p-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f628e]"
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="p-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1f628e]"
                    />
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
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-sm text-center font-nunito">
                    Already have an account? <Link to="/" className="text-[#1f628e] font-semibold underline">Log in here!</Link>
                </p>
            </div>
        </div>
        </div>
    );  
}

export default Signup;