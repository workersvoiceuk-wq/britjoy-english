import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Nunito, self-hosted (no request to Google Fonts: faster first paint, no third-party call).
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/nunito/900.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
