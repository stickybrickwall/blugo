import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const questions = [
        {
            question: "What is your skin type?",
            options: ["Oily", "Dry", "Combination", "Sensitive"],
        },
        {
            question: "What is your biggest skin concern?",
            options: ["Acne", "Aging", "Oiliness", "Dryness"],
        },
        {
            question: "What is your skincare budget?",
            options: ["$10-$50", "$50-$100", "$100-$200", "Budget is not a concern"],
        },
        {
            question: "How much time are you willing to spend on skincare daily?",
            options: ["5-10 minutes", "10-20 minutes", "20-30 minutes", "More than half an hour"],
        },
        {
            question: "How would you describe your lifestyle?",
            options: ["Often outdoors", "Often indoors/in airconditioned rooms", "Put on makeup often", "Irregular/insufficient sleep"],
        },
    ];

function Quiz() {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''));
    
    const navigate = useNavigate();
    const location = useLocation();

    const { firstName, lastName } = location.state || {};

    const handleSelect = (option: string) => {
        const newAnswers = [...answers];
        newAnswers[current] = option;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (current + 1 < questions.length) {
            setCurrent(current + 1);
        } else {
            navigate('/result', {state: { 
                answers,
                firstName,
                lastName
             } });
        }
    };

    const handlePrevious = () => {
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const q = questions[current];
    const selectedAnswer = answers[current];

    const buttonStyle = {
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        color: 'white',
        border: 'none',
        borderRadius: '8px'
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