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

    const { state } = useLocation();
    const localFirstName = localStorage.getItem('firstName');
    const localLastName = localStorage.getItem('lastName');

    const [recommendations, setRecommendations] = useState<Recommendations | null>(state?.recData?.recommendations ?? null);
    const [topSkinConcerns,   setTopSkinConcerns]   = useState<SkinConcern[]>(state?.recData?.topSkinConcerns ?? []);
    const [topIngredients,    setTopIngredients]    = useState<Ingredient[]>(state?.recData?.topIngredients ?? []);
    const [loading, setLoading] = useState(!state?.recData);
    
    const firstName = (state as any)?.firstName || localFirstName || 'there';
    const lastName = (state as any)?.lastName || localLastName || '';

    const [summary, setSummary] = useState('');


    useEffect(() => {
      const fetchSummary = async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await fetch('http://localhost:5000/summary/generate-summary', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();
          if (response.ok) {
            setSummary(data.summary);
          } else {
            console.error('Summary ftech error:', data.error);
          }
        } catch (err) {
          console.error('Failed to fetch summary:', err);
        }
      };

      if (topSkinConcerns.length > 0) {
        fetchSummary();
      }
    }, [topSkinConcerns]);
    
    const goToHome = () => {
        navigate('/home', { state: {
            firstName, 
            lastName 
        }});
    };

    useEffect(() => {
      const hasValidRecData = !!state?.recData?.recommendations;

      if (hasValidRecData) {
        setRecommendations(state?.recData?.recommendations ?? null);
        setTopSkinConcerns(state?.recData?.topSkinConcerns ?? []);
        setTopIngredients(state?.recData?.topIngredients ?? []);
        setLoading(false);
        return;
      }

    // Fallback: View past results
    const fetchRecommendations = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to view results.');
        navigate('/');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/recommend/latest', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!res.ok) {
          throw new Error('Failed to fetch past results');
        }

        const data = await res.json();

        if (!res.ok) {
        throw new Error('Failed to fetch past results');
      }

        setRecommendations(data.recommendations ?? null);
        setTopSkinConcerns(data.topSkinConcerns ?? []);
        setTopIngredients(data.topIngredients ?? []);
    } catch (err) {
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

    const getSeverityLabel = (score: number): string => {
      if (score >= 0.75) return "Very Severe";
      if (score >= 0.5) return "Severe";
      if (score >= 0.25) return "Moderate";
      return "Mild";
    };

    if (loading) {
    return (
    <div className="relative min-h-screen bg-background text-[#1f628e] font-poppins flex items-center justify-center">
      <p className="text-xl font-light">Loading...</p>
    </div>
  );
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
        <div className="relative min-h-screen bg-background text-[#1f628e] font-poppins flex flex-col">
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
              <h2 className="text-4xl font-nunito text-center text-[#547fac] mb-4">
                Hi {firstName}, here’s your skincare profile
              </h2>

              {/* Skin Concerns */}
              <div>
                <h3 className="text-2xl font-semibold pb-4 mb-2">Top Skin Concerns:</h3>
                <div className="flex flex-wrap  justify-center gap-2">
                  {topSkinConcerns.map(({ tagId, score }) => (
                  <div
                    key={tagId}
                    className="inline-block rounded-full bg-blue-100 text-blue-800 items-center text-sm px-3 py-1 font-nunito">
                    <span className="text-[#1f628e] font-bold block">{getTagName(tagId)}</span>
                    <span className="text-gray-600 text-xs block">{getSeverityLabel(score)}
                    </span>    
                  </div>
                ))}
              </div>
            </div>

              {/* Summary below skin concerns */}
              {summary && (
                <div >
                  <h3 className="text-xl font-semibold mb-2">What this says about your skin</h3>
                  <p className="text-gray-700 whitespace-pre-line">{summary}</p>
                </div>
              )}

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
                      <ul className="list-disc pl-6 text-sm mt-1">
                        {Object.entries(rec.ingredients || {}).map(([ing]) => (
                          <li key={ing}>
                            {ing}
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
                  {topIngredients.map(({ ingredientId, name }) => (
                    <li key={ingredientId}>
                      {name}
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

export default Result;``