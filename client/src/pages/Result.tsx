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
        topSkinConcerns: {
            tagId: number;
            score: number;
        }[];
        topIngredients: {
            ingredientId: number;
            name: string;
            score: number;
        }[];
    };
};

function Result() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName, recData } = (location.state || {}) as LocationState;
    const returnToHome = useReturnToHome();

    const {
        recommendations = {},
        topSkinConcerns = [],
        topIngredients = []
    } = recData || {};

    const goToHome = () => {
        navigate('/home', { state: {
            firstName, 
            lastName //goToHome should receive userId data too.
        }});
    };

    const TAG_NAMES: Record<number, string> = {
        1: 'Dry skin',
        2: 'Oily skin',
        3: 'Sensitive skin',
        4: 'Clogged pores',
        5: 'Textured skin',
        6: 'Acne-prone skin',
        7: 'Hyperpigmentation',
        8: "Dullness",
        9: "Redness",
        10: "Dehydrated skin",
        11: "Damaged skin barrier",
        12: "Aging"
    };
    const getTagName = (id: number) => TAG_NAMES[id] || `Tag ${id}`;

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

            <h3>Top Skin Concerns</h3>
            <ul>
            {topSkinConcerns.map(({ tagId, score }) => (
                <li key={tagId}>
                {getTagName(tagId)}: {(score * 100).toFixed(1)}%
                </li>
            ))}
            </ul>

            <h3>Top Ingredients</h3>
            <ul>
            {topIngredients.map(({ ingredientId, name, score }) => (
                <li key={ingredientId}>
                {name}: {score.toFixed(2)}
                </li>
            ))}
            </ul>

            <button onClick={() => returnToHome(firstName, lastName)} className="quiz-button">
                Return to Home
            </button>
        </div>
    );
}

export default Result;