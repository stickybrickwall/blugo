import { useNavigate, useLocation } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName } = location.state || {};

    const goToQuiz = () => {
        navigate('/quiz', { state: { firstName, lastName } });
    };

    const goToResults = () => {
        navigate('/result', { state: { firstName, lastName } });
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div style = {{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <h1>GlowGuide</h1>
            <h2>Welcome, {firstName} {lastName}</h2>
            <button onClick={goToQuiz}>Take the Quiz</button>
            <button onClick={goToResults}>View Past Results</button>
            <button onClick={handleLogout} style={{ backgroundColor: '#a6a6a6', color: 'white' }}>
                Logout
            </button>
        </div>
    );
}

export default Home;