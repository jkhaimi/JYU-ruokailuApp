import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [menu, setMenu] = useState([]);
    const [reviews, setReviews] = useState({});
    const [userId] = useState(localStorage.getItem("userId"));
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!userId) return;
    
        async function fetchMenu() {
            try {
                const response = await fetch(`http://localhost:5001/api/todays-menu?userId=${userId}`);
                const data = await response.json();
                if (response.ok) {
                    console.log(userId)
                    setMenu(Array.isArray(data) ? data : []);
                } else {
                    console.error("Virhe haettaessa ruokalistaa:", data.message);
                }
            } catch (error) {
                console.error("Virhe haettaessa ruokalistaa:", error);
            }
        }
    
        fetchMenu();
    }, [userId]);

    useEffect(() => {
        async function fetchAllReviews() {
            const reviewsData = {};
            for (const restaurant of menu) {
                for (const meal of restaurant.meals) {
                    try {
                        const response = await fetch(`http://localhost:5001/api/reviews/${meal.id}`);
                        const data = await response.json();
                        if (response.ok) {
                            reviewsData[meal.id] = data;
                        } else {
                            console.error("Virhe haettaessa arvosteluja:", data.message);
                        }
                    } catch (error) {
                        console.error("Virhe haettaessa arvosteluja:", error);
                    }
                }
            }
            setReviews(reviewsData);
        }
        
        if (menu.length > 0) {
            fetchAllReviews();
        }
    }, [menu]);
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Tämän päivän ruokalista</h2>
                <button onClick={() => navigate("/preferences")}>Preferences</button>
                <button onClick={() => navigate("/review")}>Review</button>
                {menu.length > 0 ? (
                    <ul>
                        {menu.map((restaurant, index) => (
                            <li key={index} className="mb-4">
                                <h3 className="font-bold">{restaurant.restaurant}</h3>
                                {restaurant.meals.length > 0 ? (
                                    <ul className="ml-4">
                                        {restaurant.meals.map((meal, idx) => {
                                            const mealReviews = reviews[meal.id] || [];
                                            const avgRating = mealReviews.length > 0 
                                                ? (mealReviews.reduce((sum, r) => sum + r.rating, 0) / mealReviews.length).toFixed(1) 
                                                : "Ei arvosteluja";

                                            return (
                                                <li key={idx} className="mb-2 p-2 border rounded">
                                                    <strong>{meal.name}</strong> - {meal.price}
                                                    <ul className="ml-4 text-sm">
                                                        {meal.components.map((component, cidx) => (
                                                            <li key={cidx}>{component}</li>
                                                        ))}
                                                    </ul>
                                                    <p className="text-sm text-gray-700">Keskiarvo: {avgRating} ⭐ ({mealReviews.length} arvostelua)</p>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">Ei aterioita tänään.</p>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Ladataan ruokalistaa...</p>
                )}
            </div>
        </div>
    );
}

// joafjosidf