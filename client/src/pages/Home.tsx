import { useNavigate, useLocation } from 'react-router-dom';
import 'aos/dist/aos.css';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName } = location.state || {};

    const goToQuiz = () => {
        navigate('/quiz', { state: { firstName, lastName } });
    };

    const handleViewPastResults = () => {
        navigate('/result', {
            state: { firstName, lastName }
        });
    };

    const goToAccount = () => {
        navigate('/account');
    };

    return (
        <div className="min-h-screen bg-background text-primary font-poppins">
            {/* NAVBAR */}
            <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md font-nunito">
                <div className="flex items-center">
                    <img src="/blugo/logo.png" alt="GlowGuide Logo" className="w-[150px]" />
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={goToQuiz} 
                        className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
                    >
                        Take the Quiz
                    </button>

                    <button 
                        onClick={handleViewPastResults}
                        className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
                    >
                        My Skin Profile
                    </button>

                    <button 
                        onClick={goToAccount} 
                        className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
                    >
                        Account
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                className="relative h-screen bg-cover bg-center"
                style={{ backgroundImage: "url('./skincare.jpg')" }}
            >
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center px-4 gap-8">
                    <h1 className="text-white text-6xl font-cormorant md:text-6xl tracking-wide">
                        Welcome, {firstName} {lastName}
                    </h1>

                    <div className="flex flex-col md:flex-col flex-wrap justify-center items-center gap-4">
                    <p className="text-white text-lg md:text-1xl font-extralight leading-tight max-w-md">
                        400 products from 150+ trusted brands.
                    </p>
                    <p className="text-white text-lg md:text-1xl font-extralight leading-tight max-w-md">
                        Matched uniquely to your skin profile.
                    </p>
                    <p className="text-white text-lg md:text-1xl font-extralight leading-tight max-w-md">
                        No marketing gimmicks, just science.
                    </p>
                    </div>

                    <button
                        onClick={goToQuiz}
                        className="border text-white rounded-xl font-nunito text-md px-6 py-3 rounded-md hover:opacity-90 transition hover:scale-105"
                    >
                        Take the Quiz
                    </button>
                </div>
            </section>
        </div>
    );
}


export default Home;