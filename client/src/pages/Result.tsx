import { useNavigate, useLocation } from 'react-router-dom';

type Product = {
    name: string;
    score: number;
    ingredients: Record<string, number>;
};

type Recommendations = Record<string, Product>;

type LocationState = {
    firstName: string;
    lastName: string;
    recData: {
        recommendations: Recommendations;
    };
};

function Result() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName, recData } = (location.state || {}) as LocationState;

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
            {['cleanser', 'toner', 'serum', 'moisturiser'].map(cat => {
                const rec = recommendations[cat];
                return rec ? (
                <div key={cat}>
                    <h4>{cat}</h4>
                    <p>{rec.name}</p>
                    <small>Score: {rec.score ?? 0}</small>
                    <ul>
                        {Object.entries(rec.ingredients || {}).map(([ing, score]) => (
                            <li key={ing}>{ing} ({score})</li>
                        ))}
                    </ul>
                </div>
                ) : (
                    <p key={cat}>No recommendation available for {cat}</p>
                );
            })}

            <button onClick={goToHome} style={{ margin: '1rem' }}>
                Return to Home
            </button>
        </div>
    );
}

export default Result;