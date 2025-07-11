import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useReturnToHome  } from '../hooks/returnToHome';

type Product = {
    name: string;
    score: number;
    ingredients: Record<string, number>;
};

type Recommendations = Record<string, Product>;

type SkinConcern = {
  tagId: number;
  score: number;
};

type Ingredient = {
  ingredientId: number;
  name: string;
  score: number;
};

function Result() {
    const navigate = useNavigate();
    const returnToHome = useReturnToHome();

    const { state } = useLocation() as {
        state: { 
            firstName?: string; 
            lastName?: string; 
            recData?: {
                recommendations: Recommendations;
                topSkinConcerns: SkinConcern[];
                topIngredients: Ingredient[];
            };
        };
    };

    const [recommendations, setRecommendations] = useState<Recommendations | null>(state?.recData?.recommendations ?? null);
    const [topSkinConcerns,   setTopSkinConcerns]   = useState<SkinConcern[]>(state?.recData?.topSkinConcerns ?? []);
    const [topIngredients,    setTopIngredients]    = useState<Ingredient[]>(state?.recData?.topIngredients ?? []);
    const [loading, setLoading] = useState(!state?.recData);

    const firstName = localStorage.getItem('firstName') || 'there';
    const lastName = localStorage.getItem('lastName') || '';

    const goToHome = () => {
        navigate('/home', { state: {
            firstName, 
            lastName 
        }});
    };

    useEffect(() => {
    if (state?.recData) return;

    // Fallback: View past results
    const fetchRecommendations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to view results.');
        navigate('/');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/recommend/latest', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch past results');
        }

        const data: {
            recommendations: Recommendations;
            topSkinConcerns: SkinConcern[];
            topIngredients: Ingredient[];
        } = await res.json();

        setRecommendations(data.recommendations ?? null);
        setTopSkinConcerns(data.topSkinConcerns ?? []);
        setTopIngredients(data.topIngredients ?? []);
    } catch (err) {
        console.error(err);
        alert('Something went wrong.');
        navigate('/home');
    } finally {
        setLoading(false);
    }
};

    fetchRecommendations();
  }, [state, navigate]);

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
    const getTagName = (id: number) => TAG_NAMES[id] ?? `Tag ${id}`;

    if (loading) {
    return <div className="p-8">Loading...</div>;
  }

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
                onClick={() => returnToHome()}
                className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
              >
                Home
              </button>
            </div>
          </nav>

          {/* Content */}
          <div className="flex-grow flex flex-col items-center pt-16 px-4 pb-32">
            <div className="w-full max-w-2xl space-y-8">
              <h2 className="text-4xl font-playfair text-center text-[#547fac] mb-4">
                Hi {firstName}, here’s your skincare profile
              </h2>

              {/* Skin Concerns */}
              <div>
                <h3 className="text-2xl font-semibold pb-4 mb-2">Top Skin Concerns:</h3>
                <div className="flex flex-wrap  justify-center gap-2">
                  {topSkinConcerns.map(({ tagId, score }) => (
                  <span
                    key={tagId}
                    className="inline-block rounded-full bg-blue-100 text-blue-800 text-sm px-3 py-1 font-nunito">
                    {getTagName(tagId) }
                  </span>
                ))}
              </div>
            </div>

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