import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("userId", data.userId); // Tallenna userId localStorageen
      navigate("/dashboard");
      console.log(data.userId)
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="app">
      <p>Tämä on mobiilisovellus, käytä puhelinta</p>
      <div className="login">
        <h2 className="text-xl font-semibold mb-4">Kirjaudu sisään</h2>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <input
            placeholder="Käyttäjänimi"
            className="mb-2 p-2 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Salasana"
            className="mb-2 p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Kirjaudu sisään
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Eikö sinulla ole tiliä?{" "}
          <a href="/register" className="text-blue-500 underline">
            Rekisteröidy
          </a>
        </p>
      </div>
    </div>
  );
}