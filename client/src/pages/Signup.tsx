import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

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
                localStorage.setItem('firstName', data.firstName);
                localStorage.setItem('lastName', data.lastName);

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
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-[#1f628e] font-poppins">
            <div className="text-center">
                <p className="text-xl font-light mb-2">Logging you in...</p>
                <p className="text-sm text-gray-500 font-nunito">
                Please allow a few moments for our server to initialize.
                </p>
            </div>
            </div>
        );
    }

    return (
        <div className="relative w-full min-h-screen bg-background overflow-x-hidden flex flex-col items-center justify-center px-4 font-nunito">
            <div
                className="absolute inset-0 bg-[url('/blugo/blue-gradient.jpg')] bg-cover bg-center opacity-20 z-0"
                aria-hidden="true"
            />
        <div className="relative z-10 flex flex-col items-center justify-center">
        <img src="/blugo/logo.png" alt="GlowGuide Logo" className="w-full max-w-[400px] pt-12" />
        <div className="bg-white rounded-xl mt-8 mb-12 p-6 shadow-md w-full max-w-sm">
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