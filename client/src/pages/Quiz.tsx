import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const questions = [
        {
            question: "How does your skin feel right after washing?",
            options: ["Very dry and tight", "Dry and tight", "Normal"],
        },
        {
            question: "How oily does your skin feel by midday?",
            options: ["Not oily", "Oily", "Very oily"],
        },
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
        </div>
    );
}

export default Quiz;