import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
            question: "How would you describe your lifestyle?",
            options: ["Often outdoors", "Often indoors/in airconditioned rooms", "Put on makeup often", "Irregular/insufficient sleep"],
        },
    ];

function Quiz() {
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const navigate = useNavigate();

    const handleAnswer = (option: string) => {
        setAnswers([...answers, option]);

        if (current + 1 < questions.length) {
            setCurrent(current + 1);
        } else {
            navigate('/result', {state: { answers } });
        }
    };

    const q = questions[current];

    return(
        <div style={{padding: '2rem'}}>
            <h2>{q.question}</h2>
            {q.options.map((option) => (
                <button
                key={option}
                onClick={() => handleAnswer(option)} 
                style={{ display: 'block', margin: '1rem 0' }}>{option}
                </button>
            ))}
        </div>
    );
}

export default Quiz;