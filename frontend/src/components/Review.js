import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Review() {
    const [menu, setMenu] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [rating, setRating] = useState(1);
    const [comment, setComment] = useState("");
    const [userId] = useState(localStorage.getItem("userId"));
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchMenu() {
            try {
                const response = await fetch(`http://localhost:5001/api/todays-menu?userId=${userId}`);
                const data = await response.json();
                if (response.ok) {
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

    async function submitReview() {
        if (!selectedMeal) {
            console.error("Valitse ateria ennen arvostelua.");
            return;
        }
        try {
            const response = await fetch("http://localhost:5001/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    meal_id: selectedMeal.id,
                    rating,
                    comment,
                }),
            });
            if (response.ok) {
                navigate("/dashboard");
            } else {
                console.error("Virhe lähetettäessä arvostelua");
            }
        } catch (error) {
            console.error("Virhe lähetettäessä arvostelua:", error);
        }
    }
    

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Lisää arvostelu</h2>
                {!selectedRestaurant ? (
                    <>
                        <h3 className="font-bold mb-2">Valitse ravintola:</h3>
                        {menu.map((restaurant, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedRestaurant(restaurant)}
                                className="block w-full p-2 mb-2 text-left border rounded"
                            >
                                {restaurant.restaurant}
                            </button>
                        ))}
                    </>
                ) : !selectedMeal ? (
                    <>
                        <h3 className="font-bold mb-2">Valitse ateria:</h3>
                        {selectedRestaurant.meals.map((meal, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedMeal(meal)}
                                className="block w-full p-2 mb-2 text-left border rounded"
                            >
                                {meal.components.join(", ")}
                            </button>
                        ))}
                    </>
                ) : (
                    <>
                        <h3 className="font-bold mb-2">Arvostele {selectedMeal.name}</h3>
                        <label className="block mb-2">Tähdet (1-5):
                            <input
                                type="number"
                                min="1"
                                max="5"
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="ml-2 border rounded p-1"
                            />
                        </label>
                        <label className="block mb-2">Kommentti:
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full border rounded p-1"
                            />
                        </label>
                        <button onClick={submitReview} className="bg-blue-500 text-white p-2 rounded">
                            Lähetä arvostelu
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
