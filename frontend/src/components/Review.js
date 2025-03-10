import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Notification from "./Notification";
import './Review.css';

export default function Review() {
    const [menu, setMenu] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [rating, setRating] = useState(1);
    const [comment, setComment] = useState("");
    const [userId] = useState(localStorage.getItem("userId"));
    const [username, setUsername] = useState(localStorage.getItem("username"));
    const navigate = useNavigate();
    const [notification, setNotification] = useState({ message: "", type: "" });

    useEffect(() => {

        if (!userId) {
            navigate("/");
        }

        async function fetchMenu() {
            try {
                const response = await fetch(`http://localhost:5001/api/todays-menu?userId=${userId}`);
                const data = await response.json();
                if (response.ok) {
                    setMenu(Array.isArray(data) ? data : []);
                } else {
                    navigate("/");
                    setNotification({ message: "Virhe haettaessa ruokalistaa: ", type: "error" });
                }
            } catch (error) {
            setNotification({ message: "Virhe lähettäessä arvostelua: " + error, type: "error" });
            }
        }
        fetchMenu();
    }, [userId]);

    async function submitReview() {
        if (!selectedMeal) {
            setNotification({ message: "Valitse ateria ennen arvostelua: ", type: "error" });
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
                navigate("/dashboard", { state: { message: "Arvostelu lisätty!", type: "success" } });
            } else {
                setNotification({ message: "Virhe lähettäessä arvostelua: ", type: "error" });
            }
        } catch (error) {
            setNotification({ message: "Virhe lähettäessä arvostelua: " + error, type: "error" });
        }
    }
    

    return (
        <div className="review-container">
        <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: "", type: "" })}
        />
            <div className="review-box">
            <h2 className="dashboard-title">Hei, {username}</h2>
            <h3 className="dashboard-title2">miltä maistui tänään?</h3>
                <div className="app-links">
                <a href="/dashboard">Ruokalista</a>                
                <a href="/preferences">Preferenssit</a>
                <a href="/review" className="active">Arvostele</a>
                </div>
                <div className="review-inputbox">
                {!selectedRestaurant ? (
                    <>
                        <h3 className="review-title">Missä ravintolassa söit tänään?</h3>
                        {menu.map((restaurant, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedRestaurant(restaurant)}
                                className="restaurant-button"
                            >
                                {restaurant.restaurant}
                            </button>
                        ))}
                    </>
                ) : !selectedMeal ? (
                    <>
                        <h3 className="review-title">Mitä söit ravintolassa {selectedRestaurant.restaurant}?</h3>
                        {selectedRestaurant.meals.map((meal, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedMeal(meal)}
                                className="meal-button"
                            >
                            <ul className="review-components">
                                {meal.components.map((component, cidx) => (
                                    <li key={cidx}>{component}</li>
                                ))}
                            </ul>
                            </button>
                        ))}
                    </>
                ) : (
                    <>
                        <h3 className="review-stars-title">
                            Miten arvostelisit aterian?<br />
                            {selectedMeal.components.map((component, index) => (
                                <span key={index}>
                                   <li> {component} </li>
                                    <br />
                                </span>
                            ))}
                        </h3>
                        {/* Tähtiarvostelu */}
                        <div className="stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <img
                                    key={star}
                                    src={rating >= star ? "star1.png" : "star3.png"}
                                    alt={`Tähtiarvosana ${star}`}
                                    className="star"
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
    
                        {/* Kommenttikenttä */}
                        <textarea
                            className="comment-box"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Kirjoita kommenttisi tähän..."
                        />
    
                        {/* Lähetä nappi */}
                        <button onClick={submitReview} className="submit-button">
                            Lähetä arvostelu
                        </button>
                    </>
                )}
            </div>
            </div>
        </div>
    );
};    
