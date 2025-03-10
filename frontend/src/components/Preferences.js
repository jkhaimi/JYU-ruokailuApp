import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Preferences.css';

export default function Preferences() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [username, setUsername] = useState(localStorage.getItem("username"));
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return;
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
      alert("Virhe: käyttäjä ID puuttuu.");
      return;
    }
    
    try {
      const response = await fetch("http://localhost:5001/api/user-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...preferences }),
      });
  
      if (response.ok) {
        console.log("Preferenssit tallennettu!");
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        alert("Virhe tallennettaessa preferenssejä: " + errorData.message);
      }
    } catch (error) {
      console.error("Virhe tallennettaessa preferenssejä:", error);
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
