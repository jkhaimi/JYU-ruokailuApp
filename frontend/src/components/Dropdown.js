import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram, Linkedin, Github } from "lucide-react";
import "./Dropdown.css";

export default function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5001/api/logout", { method: "POST" });
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      navigate("/");
    } catch (error) {
      console.error("Uloskirjautuminen epäonnistui", error);
    }
  };

  return (
    <>
      {/* Hampurilaisikoni */}
      <button className={`menu-icon ${isOpen ? "open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </button>

      {/* Koko näytön peittävä tumma overlay */}
      {isOpen && (
        <div className="dropdown-overlay" onClick={() => setIsOpen(false)}>
            <img className="dropdown-logo" src="./logo.png"></img>
          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleLogout} className="logout-button">
              Kirjaudu ulos
            </button>
            <button
            onClick={() => window.location.href = "mailto:jesse.haimi@icloud.com?subject=JYU-ruokailuApp palaute"}
            className="email-button"
            >
            Anna palautetta
            </button>
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
      )}
    </>
  );
}