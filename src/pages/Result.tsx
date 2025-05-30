import { useNavigate, useLocation } from 'react-router-dom';

function Result() {
    const navigate = useNavigate();
    const location = useLocation();
    const { firstName, lastName } = location.state || {};

    const goToHome = () => {
        navigate('/home', { state: {
            firstName, 
            lastName
        }});
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Your Results:</h1>
            <h2>Step 1: Cleanser</h2>
            <p>We recommend Dr. Loretta's Gentle Hydrating Cleanser.</p>
            <h2>Step 2: Toner</h2>
            <p>We recommend CeraVe Hydrating Toner.</p>
            <h2>Step 3: Serum</h2>
            <p>We recommend The Ordinary Hyaluronic Acid.</p>
            <h2>Step 4: Moisturiser</h2>
            <p>We recommend La Mer's The Moisturizing Soft Cream Duo.</p>
            <h2>Step 5: Sunscreen</h2>
            <p>We recommend ANESSA Perfect UV Sunscreen Skincare Gel. </p>
            <button onClick={goToHome} style={{ margin: '1rem' }}>Return to Home</button>
        </div>
    );
}

export default Result;