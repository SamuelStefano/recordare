import { Route, Switch } from 'wouter';
import { AnnouncementBar, Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { useLang } from './i18n/lang-context';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderPage } from './pages/OrderPage';
import { ProductPage } from './pages/ProductPage';

export default function App() {
  const { t } = useLang();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        {t('skipToContent')}
      </a>
      <AnnouncementBar />
      <Header />
      <main id="conteudo" className="flex-1">
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/catalogo" component={CatalogPage} />
          <Route path="/peca/:slug" component={ProductPage} />
          <Route path="/carrinho" component={CartPage} />
          <Route path="/pedido/:id" component={OrderPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}
