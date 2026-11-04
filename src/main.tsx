import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './game.css';
import './fishing.css';
import './inventory.css';
import './realty.css';
import './online.css';
import './settings.css';
import './chest.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
