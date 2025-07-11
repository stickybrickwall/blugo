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
        <div className="min-h-screen bg-background text-[#1f628e] font-poppins flex flex-col">
          {/*Background Image Layer */}
        <div 
            className="absolute inset-0 bg-[url('/blugo/blue-gradient.jpg')] bg-cover bg-center opacity-20 z-0"
            aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col min-h-screen">
        {/* NAVBAR */}
        <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md font-nunito">
            <div className="flex items-center">
              <img src="/blugo/logo.png" alt="GlowGuide Logo" className="w-[150px]" />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => returnToHome(firstName, lastName)}
                className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
              >
                Home
              </button>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-grow flex flex-col items-center pt-16 px-4 pb-32">
            <div className="w-full max-w-2xl space-y-8">
              <h2 className="text-4xl font-semibold text-center text-[#547fac] mb-4">
                Hi {firstName}, here’s your skincare profile
              </h2>

              {/* Product Picks */}
              <div>
                <h3 className="text-2xl font-semibold mb-2">Top Product Picks:</h3>
                {['cleanser', 'toner', 'serum', 'moisturiser'].map((cat, index) => {
                  const rec = recommendations[cat];
                  return rec ? (
                    <div key={cat} className="mb-6">
                      <h4 className="font-medium">
                        Step {index + 1}: {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </h4>
                      <p>{rec.name}</p>
                      <p className="text-sm text-gray-600">
                        Match Score: {(rec.score ?? 0).toFixed(2)}
                      </p>
                      <ul className="list-disc pl-6 text-sm mt-1">
                        {Object.entries(rec.ingredients || {}).map(([ing, score]) => (
                          <li key={ing}>
                            {ing} ({score})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p key={cat} className="text-sm italic text-gray-600">
                      No recommendation available for {cat}
                    </p>
                  );
                })}
              </div>

              {/* Skin Concerns */}
              {topSkinConcerns.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold mb-2">Top Skin Concerns:</h3>
                <ul className="list-none pl-0 space-y-1">
                  {topSkinConcerns.map(({ tagId, score }) => (
                    <li key={tagId}>
                      {getTagName(tagId)}: {(score * 100).toFixed(1)}%
                    </li>
                  ))}
                </ul>
              </div>
              )}

              {/* Top Ingredients */}
              {topIngredients.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold mb-2">Top Ingredients:</h3>
                <ul className="list-none pl-0 space-y-1">
                  {topIngredients.map(({ ingredientId, name, score }) => (
                    <li key={ingredientId}>
                      {name}: {score.toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>
              )}
            </div>
          </div>
        </div>
        </div>
    );
    }

export default Result;