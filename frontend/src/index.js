import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div>
    <h1 className='mobile-only'>Tämä on mobiilisovellus, käytä puhelinta</h1>
      <div className='app'>
      <App />
      </div>
    </div>
  </React.StrictMode>
);


