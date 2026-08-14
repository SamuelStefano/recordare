import { useEffect } from 'react';
import { useLocation } from 'wouter';

// Sem isto, abrir uma peça a partir do fim do catálogo deixa o visitante no meio da
// página nova. Mudança só de query string (filtro) não rola a tela.
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location]);

  return null;
}
