import { useNavigate, useLocation } from 'react-router-dom';
import 'aos/dist/aos.css';

function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName } = location.state || {};

    const goToQuiz = () => {
        navigate('/quiz', { state: { firstName, lastName } });
    };

    /*
    const handleViewPastResults = async () => {
        console.log('View past results clicked');
        const token = localStorage.getItem('token');
        try {
            if (!token) {
                alert('User not logged in');
                return;
            }
            console.log('Token being sent:', token);
            const res = await fetch('https://glowguide-lqx9.onrender.com/recommend/latest', {
            headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!res.ok || !data.recommendations) {
            alert('No past result found.');
            return;
            }

            navigate('/result', {
            state: { firstName, lastName, recData: { recommendations: data.recommendations } }
            });
        } catch (err) {
            console.error(err);
            alert('Error retrieving past result');
        }
        };
*/
    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-primary font-poppins">
            {/* NAVBAR */}
            <nav className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md">
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
                        onClick={handleLogout} 
                        className="bg-white text-[#1f628e] font-normal px-6 py-3 rounded-md hover:opacity-90 transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                className="relative h-screen bg-cover bg-center"
                style={{ backgroundImage: "url('./skincare.jpg')" }}
            >
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center px-4 gap-8">
                    <h1 className="text-white text-4xl md:text-6xl font-light tracking-wide">
                        Welcome, {firstName} {lastName}
                    </h1>

                    <div className="flex flex-col md:flex-col flex-wrap justify-center items-center gap-6">
                    <p className="text-white text-lg md:text-2xl font-extralight leading-loose max-w-md">
                        400 products from 150+ trusted brands.
                    </p>
                    <p className="text-white text-lg md:text-2xl font-extralight leading-loose max-w-md">
                        Matched uniquely to your skin profile.
                    </p>
                    <p className="text-white text-lg md:text-2xl font-extralight leading-loose max-w-md">
                        No marketing gimmicks, just science.
                    </p>
                    </div>

                    <button
                        onClick={goToQuiz}
                        className="bg-white text-[#1f628e] font-normal text-lg px-6 py-3 rounded-md hover:opacity-90 transition"
                    >
                        Take the Quiz Now!
                    </button>
                </div>
            </section>
        </div>
    );
}
//<button onClick={handleViewPastResults}>View Past Results</button>

export default Home;