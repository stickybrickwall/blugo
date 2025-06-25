import { useNavigate, useLocation } from 'react-router-dom';

function Result() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName, recData } = location.state || {};

    const { recommendations } = recData;

    const goToHome = () => {
        navigate('/home', { state: {
            firstName, 
            lastName
        }});
    };

    if (!recommendations) {
        return (
            <div style={{ padding: '2rem' }}>
                <h2>Sorry, we couldn't load your recommendations.</h2>
                <button onClick={goToHome}>Return to Home</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Hi {firstName}, here’s your skincare profile</h2>

            <h3>Top Product Picks:</h3>
            {['cleanser', 'toner', 'serum', 'moisturiser'].map(cat => (
                <div key={cat}>
                    <h4>{cat}</h4>
                    <p>{recommendations[cat]?.name}</p>
                    <small>Score: {recommendations[cat]?.score}</small>
                    <ul>
                        {Object.entries(recommendations[cat]?.ingredients || {}).map(([ing, score]) => (
                            <li key={ing}>{ing} ({score})</li>
                        ))}
                    </ul>
                </div>
            ))}

            <button onClick={goToHome} style={{ margin: '1rem' }}>Return to Home</button>
        </div>
    );
}

export default Result;