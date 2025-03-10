import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Notification from "./Notification";
import './Preferences.css';

export default function Preferences() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [preferences, setPreferences] = useState({});
  const [notification, setNotification] = useState({ message: "", type: "" });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) {
        navigate("/");
    }
      try {
        const response = await fetch(
          `http://localhost:5001/api/user-preferences?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setPreferences({
            eats_meat: data.eats_meat,
            eats_pork: data.eats_pork,
            eats_fish: data.eats_fish,
            eats_soups: data.eats_soups,
            lozzi_ok: data.lozzi_ok,
            maija_ok: data.maija_ok,
            piato_ok: data.piato_ok,
            rentukka_ok: data.rentukka_ok,
            taide_ok: data.taide_ok,
            tilia_ok: data.tilia_ok,
            uno_ok: data.uno_ok,
            ylisto_ok: data.ylisto_ok,
            only_295: data.only_295,
            only_glutenfree: data.only_glutenfree,
            only_dairyfree: data.only_dairyfree,
            only_lactosefree: data.only_lactosefree,
            eats_vegetarian: data.eats_vegetarian,
            eats_vegan: data.eats_vegan,
          });
        } else {
          console.error("Virhe haettaessa preferenssejä");
        }
      } catch (error) {
        console.error("Virhe haettaessa preferenssejä:", error);
      }
    };
    fetchPreferences();
  }, [userId]);

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      setNotification({ message: "Virhe: käyttäjä ID puuttuu. Kirjaudu sisään uudelleen", type: "error" });
      return;
    }
    
    try {
      const response = await fetch("http://localhost:5001/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...preferences }),
      });
  
      if (response.ok) {
        navigate("/dashboard", { state: { message: "Preferenssit tallennettu!", type: "success" } });
      } else {
        const errorData = await response.json();
        setNotification({ message: "Virhe tallennettaessa: " + errorData.message, type: "error" });
      }
    } catch (error) {
      setNotification({ message: "Virhe tallennettaessa preferenssejä", type: "error" });
    }
  };

  const preferenceLabels = {
    eats_meat: "Syön lihaa",
    eats_pork: "Syön possua",
    eats_fish: "Syön kalaa",
    eats_soups: "Syön keittoja",
    eats_vegetarian: "Syön kasvisruokaa",
    eats_vegan: "Syön vegaanista ruokaa",
    only_glutenfree: "Pitää olla gluteeniton",
    only_dairyfree: "Pitää olla maidoton",
    only_lactosefree: "Pitää olla laktoositon",
    only_295: "Vain 2,95€ ateriat",
    lozzi_ok: "Näytä Lozzi",
    maija_ok: "Näytä Maija",
    piato_ok: "Näytä Piato",
    rentukka_ok: "Näytä Rentukka",
    taide_ok: "Näytä Taide",
    tilia_ok: "Näytä Tilia",
    uno_ok: "Näytä Uno",
    ylisto_ok: "Näytä Ylistö",
  };
  
  return (
    <div className="preferences-container">
       <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: "", type: "" })}
      />
      <div className="preferences-box">
      <h2 className="preference-title">Hei, {username}</h2>
      <h3 className="preference-title2">mitä ja missä syödään?</h3>
        <div className="app-links">
        <a href="/dashboard">Ruokalista</a>                
        <a href="/preferences" className="active">Preferenssit</a>
        <a href="/review">Arvostele</a>
        </div>

        {/* Hinta */}
        <div className="preference-box">
        <h3 className="preferences-category">Hinta</h3>
        {["only_295"].map((key) => (
          <div key={key} className="preference-item">
            <span>{preferenceLabels[key] || key}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={preferences[key]} onChange={() => handleToggle(key)} />
              <span className="slider"></span>
            </label>
          </div>
        ))}
        </div>

        {/* Ruokavaliot */}
        <div className="preference-box">
        <h3 className="preferences-category">Ruokavalio</h3>
        {["eats_meat", "eats_pork", "eats_fish", "eats_soups", "eats_vegetarian", "eats_vegan"].map((key) => (
          <div key={key} className="preference-item">
            <span>{preferenceLabels[key] || key}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={preferences[key]} onChange={() => handleToggle(key)} />
              <span className="slider"></span>
            </label>
          </div>
        ))}
        </div>


        {/* Allergiat & erityisruokavaliot */}
        <div className="preference-box">
        <h3 className="preferences-category">Allergiat & erityisruokavaliot</h3>
        {["only_glutenfree", "only_dairyfree", "only_lactosefree"].map((key) => (
          <div key={key} className="preference-item">
            <span>{preferenceLabels[key] || key}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={preferences[key]} onChange={() => handleToggle(key)} />
              <span className="slider"></span>
            </label>
          </div>
        ))}
        </div>

        {/* Ravintolat */}
        <div className="preference-box">
        <h3 className="preferences-category">Ravintolat</h3>
        {["lozzi_ok", "maija_ok", "piato_ok", "rentukka_ok", "taide_ok", "tilia_ok", "uno_ok", "ylisto_ok"].map((key) => (
          <div key={key} className="preference-item">
            <span>{preferenceLabels[key] || key}</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={preferences[key]} onChange={() => handleToggle(key)} />
              <span className="slider"></span>
            </label>
          </div>
        ))}
        </div>

        <button onClick={handleSubmit} className="save-button">
          Tallenna
        </button>
      </div>
    </div>
  );
}
