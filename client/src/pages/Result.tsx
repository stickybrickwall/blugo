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

    const [noData, setNoData] = useState(false);

    const { state } = useLocation();
    const localFirstName = localStorage.getItem('firstName');
    const localLastName = localStorage.getItem('lastName');

    const [recommendations, setRecommendations] = useState<Recommendations | null>(state?.recData?.recommendations ?? null);
    const [topSkinConcerns,   setTopSkinConcerns]   = useState<SkinConcern[]>(state?.recData?.topSkinConcerns ?? []);
    const [topIngredients,    setTopIngredients]    = useState<Ingredient[]>(state?.recData?.topIngredients ?? []);
    const [latestResponse, setLatestResponse] = useState<string | null>(null);
    const [loading, setLoading] = useState(!state?.recData);
    
    const firstName = (state as any)?.firstName || localFirstName || 'there';
    const lastName = (state as any)?.lastName || localLastName || '';

    const [skinConcernExp, setSkinConcernExp] = useState('');
    const [productExp, setProductExp] = useState('');


    useEffect(() => {
      if (state?.recData?.skinConcernExplanation) {
        setSkinConcernExp(state.recData.skinConcernExplanation);
      }
      if (state?.recData?.productExplanation) {
        setProductExp(state.recData.productExplanation);
      }
    }, [state]);
    
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
        });

        if (res.status === 404) {
          // No quiz data for user
          setNoData(true);
          return;
        }

        if (!res.ok) {
        throw new Error('Failed to fetch past results');
      }

        const data = await res.json();

        setRecommendations(data.recommendations ?? null);
        setTopSkinConcerns(data.topSkinConcerns ?? []);
        setTopIngredients(data.topIngredients ?? []);
        setSkinConcernExp(data.skinConcernExplanation ?? '');
        setProductExp(data.productExplanation ?? '');
        setLatestResponse(data.latestResponse ?? null);

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

    if (noData) {
      return (
        <div className="min-h-screen bg-background text-center text-[#1f628e] font-poppins flex flex-col items-center justify-center">
          <p className="text-lg mb-6">You haven’t completed the quiz yet.</p>
          <button
            onClick={() => navigate('/quiz')}
            className="bg-[#1f628e] text-white px-6 py-3 rounded-md hover:opacity-90 transition"
          >
            Take the Quiz
          </button>
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
          <div className="flex-grow flex flex-col items-center pt-16 px-4 pb-32 font-poppins">              
              {/* User Greeting */}
                <h2 className="text-4xl text-center text-[#547fac] mb-10">
                  Hi {firstName}, here’s your skincare profile
                </h2>

            <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col md:flex-row gap-8">


              {/* Left Column */}
              <div className="flex-1 space-y-6">
                {/* Skin Concerns */}
                <div>
                  <h3 className="text-2xl pb-4 mb-2">Top Skin Concerns</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topSkinConcerns.map(({ tagId, score }) => {
                      const severity = getSeverityLabel(score);
                      const percentage = Math.round(score * 100);

                      return (
                        <div
                        key={tagId}
                        className="bg-white rounded-xl shadow-sm p-4">

                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[#1f628e] text-md">{getTagName(tagId)}</h4>
                              <span className="text-sm font-light text-gray-600 italic">{severity}</span>
                          </div>

                      {/* Severity bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor:
                              score >= 0.8
                                ? '#9b1c1c'
                                : score >= 0.7
                                ? '#c95f36'
                                : score >= 0.5
                                ? '#d68b39'
                                : '#e1b866',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skin Concern Explanation */}
              {skinConcernExp && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-white">
                    <h3 className="text-2xl mb-4 text-[#1f628e] items-center gap-2">
                      What This Says About Your Skin
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed text-justify">
                      {skinConcernExp}
                    </p>
                  </div>
              )}

              {/* Top Ingredients */}
              {topIngredients.length > 0 && (
              <div>
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-white">
                <h3 className="text-2xl mb-2 pb-4">Top Ingredients</h3>
                <ul className="flex flex-wrap justify-center gap-2">
                  {topIngredients.map(({ name }, i) => (
                    <li
                      key={i}
                      className="bg-gray-100 text-[#1f628e] text-gray-600 px-3 py-1 rounded-full shadow-sm"
                    >
                      {name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </li>
                  ))}
                </ul>
                </div>
                </div>
              )}
            
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-6">
              {/* Product Picks */}
              <div>
                <h3 className="text-2xl text-[#1f628e] pb-4 mb-2">Top Product Picks</h3>
                {['cleanser', 'toner', 'serum', 'moisturiser'].map((cat, index) => {
                  const rec = recommendations[cat];
                  return rec ? (
                    <div className="bg-white rounded-2xl shadow-sm p-3 border border-white mb-6">
                    <div key={cat} className="w-full text-[#1f628e]">
                      <h4 className="font-medium">
                        Step {index + 1}: {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </h4>
                      <p className="text-lg font-light text-gray-900">{rec.name}</p>
                    </div>
                    </div>
                  ) : (
                    <p key={cat} className="text-sm italic text-gray-600">
                      No recommendation available for {cat}
                    </p>
                  );
                })}
              </div>

              {/* Product Explanation */}
              {productExp && (
                  <div className="bg-white rounded-2xl shadow-sm p-6 border border-white">
                    <h3 className="text-2xl mb-4 text-[#1f628e] items-center gap-2">
                      Why These Products?
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed text-justify">
                      {productExp}
                    </p>
                  </div>
              )}

            </div>
          </div>
        </div>
        {latestResponse && (
        <p className="text-sm text-gray-500 italic text-center mt-8 pb-4">
          Based on your response at {new Date(latestResponse).toLocaleString('en-SG', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Singapore'
            })}
        </p>
      )}
      </div>
    </div>
    );
    }

export default Result;