import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReturnToHome } from '../hooks/returnToHome';
import { supabase } from '../../supabaseClient';

type Answer =
    | { question_id: number; type: 'single'; answer_id: number }
    | { question_id: number; type: 'multi'; answer_ids: number[] }
    | { question_id: number; type: 'scale'; scale_value: number };

function Quiz() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [answersByQuestion, setAnswersByQuestion] = useState<Record<number, any[]>>({});
    const [current, setCurrent] = useState(0);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();
    const returnToHome = useReturnToHome();
    
    const { firstName, lastName } = location.state || {};


    useEffect(() => {
        const fetchQuizData = async () => {
        const { data: questionsData, error: qError } = await supabase
            .from('questions')
            .select('*')
            .order('id', { ascending: true });

        const { data: answersData, error: aError } = await supabase
            .from('answers')
            .select('*');

        if (qError || aError) {
            console.error('Failed to fetch quiz data:', qError || aError);
            return;
        }

        const grouped = (answersData || []).reduce((acc, answer) => {
            const qid = answer.question_id;
            acc[qid] = acc[qid] || [];
            acc[qid].push(answer);
            return acc;
        }, {} as Record<number, any[]>);

        setQuestions(questionsData || []);
        setAnswersByQuestion(grouped);
        setLoadingQuestions(false);
        };

        fetchQuizData();
    }, []);

    const totalQuestions = questions.length;
    const q = questions[current];
    const selectedAnswer = answers.find(r => r.question_id === q?.id);

    // Helps determine if user can select 'next' button, 3 options have to be selected for 'multi' type questions
    const canProceed =
        q?.question_type === 'multi'
            ? selectedAnswer?.type === 'multi' && selectedAnswer.answer_ids.length === 3
            : selectedAnswer !== undefined;
            
    const handleSelect = (
        question_id: number,
        type: 'single' | 'scale',
        value: number
        ) => {
        setAnswers(prev => {
            const filtered = prev.filter(r => r.question_id !== question_id);

            if (type === 'single') {
                return [...filtered, { question_id, type: 'single', answer_id: value }];
            } else if (type === 'scale') {
                return [...filtered, { question_id, type: 'scale', scale_value: value }];
            }
            return prev;
        });
    };

    // Handle questions of type 'multi'
    const handleMultiSelect = (question_id: number, answer_id: number) => {
        setAnswers(prev => {
            const existing = prev.find(
                r => r.question_id === question_id && r.type === 'multi'
            ) as { question_id: number; type: 'multi'; answer_ids: number[] } | undefined;

            const filtered = prev.filter(r => r.question_id !== question_id);

            if (existing) {
                const alreadySelected = existing.answer_ids.includes(answer_id);

                if (alreadySelected) {
                    const newIds = existing.answer_ids.filter(id => id !== answer_id);
                    return [...filtered, { question_id, type: 'multi', answer_ids: newIds }];
                } else {
                // Only allow up to 3 selections
                    if (existing.answer_ids.length >= 3) {
                        return prev; // Do nothing if limit reached
                    }
                    return [...filtered, { question_id, type: 'multi', answer_ids: [...existing.answer_ids, answer_id] }];
                }
            } else {
            // First selection
                return [...filtered, { question_id, type: 'multi', answer_ids: [answer_id] }];
            }
        });
    };
        
    const handlePrevious = () => {
        if (current > 0) {
            setCurrent(current - 1);
        }
    };

    const handleNext = () => {
        if (current < totalQuestions - 1) {
            setCurrent(current + 1);
        }
    };

    const submitQuiz = async() => {
        setLoading(true);
        
        try {
            const token = localStorage.getItem('token');

            const responses: Record<string, string | string[] | number> = {};

            for (const ans of answers) {
                const question = questions.find(q => q.id === ans.question_id);
                if (!question) continue;

                if (ans.type === 'single') {
                    const option = answersByQuestion[question.id]?.find(o => o.id === ans.answer_id);
                    if (option) responses[question.text] = option.answer_text;
                }

                else if (ans.type === 'scale') {
                    responses[question.text] = ans.scale_value;
                }

                else if (ans.type === 'multi') {
                    const selectedOptions = answersByQuestion[question.id]?.filter(o =>
                    ans.answer_ids.includes(o.id)
                    );
                    if (selectedOptions?.length) {
                    responses[question.text] = selectedOptions.map(o => o.answer_text);
                    }
                }
            }
            
            console.log('Formatted responses:', responses);
            
            const res = await fetch('http://localhost:5000/quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ responses })
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
                    {q?.text}
                </h2>
            
            {/* OPTIONS */}

            {/* Options for 'single' type questions */}
            {q?.question_type === 'single' && (
                <div className="flex flex-col gap-4 w--96">
                    {answersByQuestion[q.id]?.map((option: any) => (
                    <button
                        key={option.id}
                        onClick={() => handleSelect(q.id, 'single', option.id)}
                        className={`w-96 px-6 py-3 rounded-lg border text-white text-center whitespace-nowrap transition break-words ${
                        selectedAnswer?.type === 'single' && selectedAnswer.answer_id === option.id
                            ? 'bg-[#1f628e] border-[#1f628e]'
                            : 'bg-[#aab5bd] border-gray-300 hover:opacity-90 hover:scale-105'
                        }`}
                    >
                        {option.answer_text}
                    </button>
                    ))}
                </div>
                )}

            {/* Options for 'scale' type questions */}
            {q?.question_type === 'scale' && (
            <div className="flex flex-row gap-4">
                {[1, 2, 3, 4, 5].map((val) => (
                <button
                    key={val}
                    onClick={() => handleSelect(q.id, 'scale', val)}
                    className={`w-12 h-12 rounded-full border text-white font-light text-lg transition ${
                    selectedAnswer?.type === 'scale' && selectedAnswer.scale_value === val
                        ? 'bg-[#1f628e] border-[#1f628e]'
                        : 'bg-[#aab5bd] border-gray-300 hover:opacity-90 hover:scale-105'
                    }`}
                >
                    {val}
                </button>
                ))}
            </div>
            )}

            {/* Options for 'multi' type questions */}
            {q?.question_type === 'multi' && (
                <div className="flex flex-col gap-4 w--96">
                    {answersByQuestion[q.id]?.map((option: any) => {
                    const selected = selectedAnswer?.type === 'multi' && selectedAnswer.answer_ids.includes(option.id);
                    return (
                        <button
                            key={option.id}
                            onClick={() => handleMultiSelect(q.id, option.id)}
                            className={`w-96 px-6 py-3 rounded-lg border text-white text-center whitespace-nowrap transition break-words ${
                                selected
                                    ? 'bg-[#1f628e] border-[#1f628e]'
                                : 'bg-[#aab5bd] border-gray-300 hover:opacity-90 hover:scale-105'
                            }`}
                        >
                            {option.answer_text}
                        </button>
                    );
                })}
                </div>
                )}
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

                    {/* Next or Submit */}
                    {current < questions.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className="px-6 py-3 rounded-md bg-[#1f628e] text-white font-light disabled:bg-gray-300 disabled:opacity-60 hover:scale-105"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={submitQuiz}
                            disabled={!canProceed}
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