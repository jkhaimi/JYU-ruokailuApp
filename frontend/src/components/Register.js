import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Salasanat eivät täsmää");
      return;
    }

    const response = await fetch("http://localhost:5001/api/register", { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId);
        setUserId(data.userId);
        console.log(data.userId)
        navigate("/preferences");
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Rekisteröidy</h2>
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
          <input
            type="password"
            placeholder="Vahvista salasana"
            className="mb-2 p-2 border rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            Rekisteröidy
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Onko sinulla jo tili?{" "}
          <a href="/" className="text-blue-500 underline">
            Kirjaudu sisään
          </a>
        </p>
      </div>
    </div>
  );
}
