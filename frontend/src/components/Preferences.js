import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Preferences() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
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
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Ruokapreferenssit</h2>
        <div className="flex flex-col gap-2">
          {Object.keys(preferences).map((key) => (
            <label key={key} className="flex justify-between items-center p-2 border rounded">
              <span>{key.replace("eats_", "would you eat ") + "?"}</span>
              <input
                type="checkbox"
                checked={preferences[key]}
                onChange={() => handleToggle(key)}
              />
            </label>
          ))}
        </div>
        <button onClick={handleSubmit} className="bg-blue-500 text-white p-2 rounded mt-4 w-full">
          OK
        </button>
      </div>
    </div>
  );
}
