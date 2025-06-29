import { useNavigate, useLocation } from 'react-router-dom';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName } = location.state || {};

    const goToQuiz = () => {
        navigate('/quiz', { state: { firstName, lastName } });
    };

    const handleViewPastResults = async () => {
        console.log('View past results clicked');
        const token = localStorage.getItem('token');
        try {
            if (!token) {
                alert('User not logged in');
                return;
            }
            console.log('Token being sent:', token);
            const res = await fetch('http://localhost:5000/recommend/latest', {
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

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div style = {{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <h1>GlowGuide</h1>
            <h2>Welcome, {firstName} {lastName}</h2>
            <button onClick={goToQuiz}>Take the Quiz</button>

            <button onClick={handleLogout} style={{ backgroundColor: '#a6a6a6', color: 'white' }}>
                Logout
            </button>
        </div>
    );
}

//<button onClick={handleViewPastResults}>View Past Results</button>

export default Home;