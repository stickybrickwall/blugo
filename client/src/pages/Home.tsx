import { useNavigate, useLocation } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName } = location.state || {};

    const goToQuiz = () => {
        navigate('/quiz', { state: { firstName, lastName } });
    };

    /*
    const handleViewPastResults = async () => {
        console.log('View past results clicked');
        const token = localStorage.getItem('token');
        try {
            if (!token) {
                alert('User not logged in');
                return;
            }
            console.log('Token being sent:', token);
            const res = await fetch('https://glowguide-lqx9.onrender.com/recommend/latest', {
            headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok || !data.recommendations) {
            alert('No past result found.');
            return;
            }

            navigate('/result', {
            state: { firstName, lastName, recData: { recommendations: data.recommendations } }
            });
        } catch (err) {
            console.error(err);
            alert('Error retrieving past result');
        }
        };
*/
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div style = {{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
            <img src="/blugo/logo.png" alt="GlowGuide Logo" style={{ width: '400px'}} />
            </div>
            <h2 className="welcome-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                <strong>Welcome, {firstName} {lastName}!</strong></h2>
            <p style={{ marginTop: 0, lineHeight: '1.6' }}>
                Over <strong>400 products</strong> from <strong>150+ trusted brands</strong>, matched to<br />
                your unique skin profile using our <strong>ingredient-first</strong> algorithm.<br />
                No marketing gimmicks. Just science-backed recommendations.
            </p>
            <button onClick={goToQuiz} className="home-button">Take the Quiz</button>
            <button onClick={handleLogout} className="home-button" style={{ backgroundColor: '#a6a6a6', color: 'white' }}>
                Logout
            </button>
        </div>
    );
}

//<button onClick={handleViewPastResults}>View Past Results</button>

export default Home;