import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'wouter';
import './index.css';
import App from './App';
import { LangProvider } from './i18n/LangProvider';
import { CatalogProvider } from './catalog/CatalogProvider';
import { CartProvider } from './cart/CartProvider';
import { ScrollToTop } from './components/layout/ScrollToTop';

const base = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router base={base}>
      <LangProvider>
        <CatalogProvider>
          <CartProvider>
            <ScrollToTop />
            <App />
          </CartProvider>
        </CatalogProvider>
      </LangProvider>
    </Router>
  </StrictMode>
);
