import { useNavigate, useLocation } from 'react-router-dom';
import { useReturnToHome  } from '../hooks/returnToHome';

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
    const returnToHome = useReturnToHome();

    const { recommendations } = recData;

    const goToHome = () => {
        navigate('/home', { state: {
            firstName, 
            lastName //goToHome should receive userId data too.
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
            {['cleanser', 'toner', 'serum', 'moisturiser'].map((cat, index) => {
                const rec = recommendations[cat];
                return rec ? (
                <div key={cat}>
                    <h4>Step {index + 1}: {cat.charAt(0).toUpperCase() + cat.slice(1)}</h4>
                    <p>{rec.name}</p>
                    <small>Match Score: {(rec.score ?? 0).toFixed(2)}</small>
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

            <button onClick={() => returnToHome(firstName, lastName)} className="quiz-button">
                Return to Home
            </button>
        </div>
    );
}

export default Result;