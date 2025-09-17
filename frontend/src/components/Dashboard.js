import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css"; 
import StarRating from "./StarRating";
import Dropdown from "./Dropdown";
import Notification from "./Notification";

export default function Dashboard() {
    const [menu, setMenu] = useState([]);
    const [reviews, setReviews] = useState({});
    const [userId] = useState(localStorage.getItem("userId"));
    const [username, setUsername] = useState(localStorage.getItem("username"));
    const [notification, setNotification] = useState({ message: "", type: "" });
    const location = useLocation();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!userId) {
            navigate("/");
        }
    
        async function fetchMenu() {
            try {
                // const response = await fetch(`/api/todays-menu?userId=${userId}`);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/todays-menu?userId=${userId}`);
                // const response = await fetch(`http://ec2-51-20-10-127.eu-north-1.compute.amazonaws.com:5001/api/todays-menu?userId=${userId}`);
                // const response = await fetch(`http://localhost:5001/api/todays-menu?userId=${userId}`);
                const data = await response.json();
                if (response.ok) {
                    console.log(userId)
                    console.log(username)
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
                        // const response = await fetch(`/api/reviews/${meal.id}`);
                        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/reviews/${meal.id}`);
                        // const response = await fetch(`http://ec2-51-20-10-127.eu-north-1.compute.amazonaws.com:5001/api/reviews/${meal.id}`);
                        // const response = await fetch(`http://localhost:5001/api/reviews/${meal.id}`);
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

    useEffect(() => {
        if (location.state?.message) {
          setNotification({ message: location.state.message, type: location.state.type });
    
          // Tyhjennä navigoinnin state, jotta viesti ei jää pysyvästi
          window.history.replaceState({}, document.title);
        }
      }, [location.state]);
    
    return (
        <div className="dashboard-container">
            <Notification 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ message: "", type: "" })} 
            />
            <div className="dashboard-box">
                <div>
                    <h2 className="dashboard-title">Hei, {username}</h2>
                    <h3 className="dashboard-title2">mitä tänään syötäisiin?</h3>
                    <Dropdown />
                </div>                                                                                        
                <div className="app-links">
                <a href="/dashboard" className="active">Ruokalista</a>                
                <a href="/preferences">Preferenssit</a>
                <a href="/review">Arvostele</a>
                </div>

                {menu.length > 0 ? (
                    <div>
                        {menu.map((restaurant, index) => (
                            <div key={index} className="restaurant-box">
                                <h3 className="restaurant-title">{restaurant.restaurant}</h3>
                                {restaurant.meals.length > 0 ? (
                                    <div>
                                        {restaurant.meals.map((meal, idx) => {
                                            const mealReviews = reviews[meal.id] || [];
                                            const avgRating =
                                                mealReviews.length > 0
                                                    ? (mealReviews.reduce((sum, r) => sum + r.rating, 0) / mealReviews.length).toFixed(0)
                                                    : "Ei arvosteluja";

                                            return (
                                                <div key={idx} className="meal-box">
                                                    {/* <p className="meal-name">{meal.name}</p> */}
                                                    <ul className="meal-components">
                                                        {meal.components.map((component, cidx) => (
                                                            <li key={cidx}>{component}</li>
                                                        ))}
                                                    </ul>
                                                    <p className="meal-price">{meal.price}</p>
                                                    <div className="meal-reviews">
                                                        <StarRating rating={avgRating} /> <span className="review-amount">({mealReviews.length})</span>
                                                    </div>    
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p>Ei sopivia aterioita...</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>Ladataan ruokalistaa...</p>
                )}
            </div>
        </div>
    );
}
