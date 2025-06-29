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
            const res = await fetch('https://glowguide-lqx9.onrender.com/auth/signup', {
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
        <>
        <img src="/blugo/logo.png" alt="GlowGuide Logo" style={{ width: '400px'}} />
        <div className="Signup">
            <div className="signup-box">
                <h2 className="signup-title">Sign Up</h2>
                <form onSubmit={handleSignup}>
                    <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit">Sign Up</button>
                </form>
                <p style={{ marginTop: '1rem' }}>
                    Already have an account? <Link to="/">Log in here!</Link>
                </p>
            </div>
        </div>
    </>
    );  
}

export default Signup;