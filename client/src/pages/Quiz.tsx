import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    options: ["< $20", "$20 - $50", "> $50"]
    }
];

function Quiz() {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<{ [question:string]: string }>({});
    
    const navigate = useNavigate();
    const location = useLocation();

    const { firstName, lastName } = location.state || {};

    const handleSelect = (option: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questions[current].question]: option
        }));
    };

    const handleNext = () => {
        if (current + 1 < questions.length) {
            setCurrent(current + 1);
        } else {
            submitQuiz();
        }
    }
    
    const handlePrevious = () => {
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const q = questions[current];
    const selectedAnswer = answers[q.question];

    const buttonStyle = {
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        color: 'white',
        border: 'none',
        borderRadius: '8px'
    };

    const submitQuiz = async() => {
        const token = localStorage.getItem('token');
         const res = await fetch('https://glowguide-lqx9.onrender.com/quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ responses: answers })
        });

        const data = await res.json();
        if (res.ok) {
            console.log('Quiz saved');
            navigate('/result', { state: { answers, firstName, lastName } });
        } else {
            alert('Failed to submit quiz: ' + data.error);
        }
    };

    return(
        <div style={{padding: '2rem'}}>
            <h2>{q.question}</h2>
            {q.options.map((option) => (
                <button
                key={option}
                onClick={() => handleSelect(option)} 
                style={{ 
                    display: 'block', 
                    margin: '1rem 0',
                    backgroundColor: selectedAnswer === option ? '#386cb2' : '#7c9fcf',
                    color: selectedAnswer === option ? 'white' : '',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    cursor: 'pointer'
                }}>{option}
                </button>
            ))}

            <div style={{ marginTop: '2rem'}}>
                <button 
                onClick={handlePrevious} 
                disabled={current===0}
                style={{
                    ...buttonStyle,
                    backgroundColor: current > 0 ? '#386cb2' : '#b0c4de',
                    cursor: current > 0 ? 'pointer' : 'not-allowed'
                }}>
                    Previous
                </button>

                <button 
                onClick={handleNext} 
                disabled={!selectedAnswer} 
                style={{
                    ...buttonStyle,
                    marginLeft: '1rem',
                    backgroundColor: selectedAnswer ? '#386cb2' : '#b0c4de',
                    cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                    opacity: selectedAnswer ? 1 : 0.6
                }}>
                    {current===questions.length - 1 ? 'View Results' : 'Next'}
                </button>
            </div>

            <div style={{ marginTop: '2rem'}}>
            {current === 0 && (
                <button
                    onClick={() => navigate('/home')}
                    style={{
                        ...buttonStyle,
                        backgroundColor: '#386cb2',
                        marginBottom: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    Home
                </button>
            )}
            </div>

        </div>
    );
}

export default Quiz;