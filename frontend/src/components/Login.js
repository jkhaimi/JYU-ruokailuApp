import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Instagram, Linkedin, Github } from "lucide-react";
import Notification from "./Notification";
import "../App.css";
import "./Signing.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      navigate("/dashboard", { state: { message: "Tervetuloa " + data.username, type: "success" } });
      console.log(data.userId)
    } else {
      setNotification({ message: "Virhe kirjautuessa sisään: " + data.message, type: "error" });
    }
  };

  return (
    <div className="login-container">
      <Notification 
      message={notification.message} 
      type={notification.type} 
      onClose={() => setNotification({ message: "", type: "" })} 
      />
      <img className="logo" src="/Logo.png" alt="JYU RuokailuApp"></img>
      <div className="login-box">
        <div className="auth-links">
          <a href="/" className="active">Kirjaudu sisään</a>
          <a href="/register">Rekisteröidy</a>
        </div>

        <form className="username-container" onSubmit={handleSubmit}>
          <p>Käyttäjänimi</p>
          <input
            type="text"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          
          <div className="password-container">
            <p>Salasana</p>
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="login-button">Kirjaudu sisään</button>
        </form>
      </div>
      <div className="footer">
      <p>© Jesse Haimi Original Design</p>
      <div className="social-links">
        <a href="https://www.instagram.com/jessehaimi" target="_blank" rel="noopener noreferrer">
          <Instagram size={32} />
        </a>
        <a href="https://www.linkedin.com/in/jesse-haimi-019429256/" target="_blank" rel="noopener noreferrer">
          <Linkedin size={32} />
        </a>
        <a href="https://github.com/jkhaimi/JYU-ruokailuApp" target="_blank" rel="noopener noreferrer">
          <Github size={32} />
        </a>
      </div>
    </div>
  </div>
  );
}