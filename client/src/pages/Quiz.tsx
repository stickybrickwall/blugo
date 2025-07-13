import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReturnToHome } from '../hooks/returnToHome';

const questions = [
    { //Q1
        question: "What is your age?",
        options: ["Under 20", "20s", "30s", "40s", "50 and above"]
    },
    { //Q2
        question: "How does your skin feel right after washing?",
        options: ["Very dry and tight", "Dry and tight", "Tight but oily later", "Normal"]
    },
    { //Q3
        question: "How oily does your skin feel by midday?",
        options: ["Not oily", "Oily", "Very oily"]
    },
    { //Q4
        question: "What is your top skin concern right now?",
        options: [
            "Acne and bumpiness",
            "Dryness",
            "Oiliness",
            "Dark spots and dullness",
            "Fine lines and wrinkles",
            "Redness and irritation",
            "Enlarged pores"
        ]
    },
    { //Q5
        question: "Do you experience frequent clogged pores, blackheads or enlarged pores?",
        options: ["Yes", "No"]
    },
    { //Q6
        question: "Do you often experience flaking, roughness or tightness?",
        options: ["Yes", "No"]
    },
    { //Q7
        question: "Do you often experience redness or sensitivity to new products?",
        options: ["Yes", "No"]
    },
    { //Q8
        question: "Do you have any visible dark spots or uneven skin tone?",
        options: ["Yes", "No"]
    },
    { //Q9
        question: "Do you experience frequent breakouts or acne?",
        options: ["Yes", "No"]
    },
    { //Q10
        question: "Do you notice fine lines or loss of firmness?",
        options: ["Yes", "No"]
    },
    { //Q11
        question: "How much time do you spend outdoors daily?",
        options: ["< 1 hour", "1 - 2 hours", "2 - 4 hours", "4 + hours"]
    },
    { //Q12
        question: "What is the climate like where you live?",
        options: [
            "Humid",
            "Balanced",
            "Dry",
            "I'm often in indoors, air-conditioned spaces"
        ]
    },
    { //Q13
        question: "How often do you wear makeup?",
        options: [
            "Rarely or never",
            "A few times a week",
            "Daily (light makeup)",
            "Daily (heavy makeup)"
        ]
    },
    { //Q14
        question: "How would you describe your sleep habits?",
        options: [
            "I sleep well and regularly",
            "I sleep okay but not always consistently",
            "I often sleep too little or feel tired",
            "My sleep schedule is very irregular or disrupted"
        ]
    },
    { //Q15
    question: "What is your budget per product?",
    options: ["< $30", "$30 - $60", "> $60"]
    }
];

function Quiz() {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<{ [question:string]: string }>({});
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const returnToHome = useReturnToHome();
    const totalQuestions = questions.length;

    const q = questions[current];
    const selectedAnswer = answers[q.question];

    const { firstName, lastName } = location.state || {};

    const handleSelect = (option: string) => {
        // 1. Record the answer
        setAnswers((prev) => ({
            ...prev,
            [questions[current].question]: option
        }));

        // 2. Automatically move to next question
        if (current + 1 < questions.length) {
            setTimeout(() => {
                setCurrent(current + 1);
            }, 500);
        }
    };
    
    const handlePrevious = () => {
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const submitQuiz = async() => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        
        const res = await fetch('http://localhost:5000/quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ responses: answers })
        });
        console.log('received response from server', res);

        const data = await res.json();
        if (!res.ok) {
            alert('Failed to submit quiz: ' + data.error);
            setLoading(false);
            return;
        }
        console.log('Quiz saved');

        const recRes = await fetch('http://localhost:5000/recommend/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const recData = await recRes.json();

        if (!recRes.ok) {
            alert('Failed to generate recommendations: ' + recData.error);
            setLoading(false);
            return;
        }
        
        navigate('/result', { state: { firstName, lastName, recData } });

    } catch (err) {
        console.error(err);
        alert('Something went wrong with submitting your quiz.');
    } finally {
        setLoading(false);
    }
    };

    if (loading) return <p>Hang tight! We are generating your recommendations...</p>;

    return (
    <div className="relative min-h-screen bg-background text-primary font-poppins flex flex-col">
        {/*Background Image Layer */}
        <div 
            className="absolute inset-0 bg-[url('/blugo/blue-gradient.jpg')] bg-cover bg-center opacity-20 z-0"
            aria-hidden="true"
        />
        {/* Foreground Content */}
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
            
            {/* QUIZ CONTENT */}
            <div className="flex-grow flex flex-col items-center justify-center px-4">
            {/* Question */}
                <h2 className="text-2xl md:text-3xl font-light text-[#547fac] text-center mb-8">
                    {q.question}
                </h2>

            {/* Options */}
                    <div className="flex flex-col gap-4 w--96">
                        {q.options.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleSelect(option)}
                            className={`w-96 px-6 py-3 rounded-lg border text-white text-center whitespace-nowrap transition break-words ${
                            selectedAnswer === option
                                ? 'bg-[#1f628e] border-[#1f628e]'
                                : 'bg-[#aab5bd] border-gray-300 hover:opacity-90 hover:scale-105'
                            }`}
                        >
                            {option}
                        </button>
                        ))}
                    </div>
            </div>

            {/* Navigation buttons */}
                <div className="fixed top-40 left-1/2 transform -translate-x-1/2 flex gap-12">
                    {/*Show Previous button only if not on first question */}
                    {current > 0 && (
                        <button
                            onClick={handlePrevious}
                            disabled={current === 0}
                            className="px-6 py-3 rounded-md bg-[#1f628e] text-white font-light disabled:bg-gray-300 disabled:opacity-60 hover:scale-105"
                        >
                            Previous
                        </button>
                    )}
                
                    {/* Show Submit button onlt on the last question */}
                    {current === questions.length - 1 && (
                        <button
                            onClick={submitQuiz}
                            className="px-6 py-3 rounded-md bg-[#1f628e] text-white font-light disabled:bg-gray-300 disabled:opacity-60 hover:scale-105"
                        >
                            View Results
                        </button>
                    )}
                </div>
            
            {/* Progress Bar */}
                <div className="fixed bottom-[2rem] left-0 w-full z-50 px-4 py-2">
                    <div className="max-w-xl mx-auto text-center">
                        <div className="w-full bg-gray-300 rounded-full h-1 mb-4">
                            <div
                            className="bg-[#1f628e] h-1 rounded-full transition-all duration-300"
                            style={{ width: `${((current + 1) / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                        <p className="text-sm mb-2">
                            Question {current + 1} of {totalQuestions}
                        </p>
                    </div>
                </div>
            </div>
        </div>
);
}

export default Quiz;