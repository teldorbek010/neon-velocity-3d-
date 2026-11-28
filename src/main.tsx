import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for PWA WebAPK and offline caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
