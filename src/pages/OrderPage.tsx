import { useParams } from 'wouter';
import { useCatalog } from '../catalog/catalog-context';
import { ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Layout';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLang } from '../i18n/lang-context';
import { whatsappLink, whatsappMessage } from '../lib/cart';
import { orderReference } from '../lib/catalog';
import { readReceipt } from '../lib/order';

export function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { lang, t } = useLang();
  const { products } = useCatalog();

  const reference = orderReference(id);
  useDocumentMeta({
    title: `${t('orderTitle')} · Recordare`,
    description: t('orderBody'),
    noindex: true,
  });

  const receipt = readReceipt(id);

  // O link do WhatsApp é um atalho, não o pedido: se o número não estiver configurado ou
  // o recibo não estiver na sessão, a venda continua registrada e a loja avisa que vai
  // ligar. Nada aqui pode fazer o cliente achar que o pedido se perdeu.
  const link =
    receipt &&
    whatsappLink(
      import.meta.env.VITE_WHATSAPP_PHONE,
      whatsappMessage(products, receipt.items, {
        lang,
        customer: receipt.customer,
        reference,
      })
    );

  return (
    <Container wide={false} className="py-20">
      <div className="border border-line bg-cream px-6 py-14 text-center sm:px-12">
        <span className="text-[9.5px] font-semibold tracking-[.32em] text-brand uppercase">
          Recordare
        </span>
        <h1 className="mt-5 font-serif text-[38px] leading-[1.1] tracking-[-.01em] text-ink">
          {t('orderTitle')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
          {t('orderBody')}
        </p>

        <dl className="mt-9 inline-flex flex-col items-center gap-1 border-y border-line px-8 py-5">
          <dt className="text-[10.5px] font-semibold tracking-[.22em] text-muted uppercase">
            {t('orderNumber')}
          </dt>
          <dd className="font-serif text-[30px] tracking-[.06em] text-ink">{reference}</dd>
        </dl>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-[52px] items-center rounded-[2px] bg-brand px-8 text-[14px] font-medium text-white transition-colors duration-200 hover:bg-brand-dark"
            >
              {t('orderWhatsapp')}
            </a>
          ) : (
            <p className="w-full text-[13px] text-muted">{t('orderNoContact')}</p>
          )}
          <ButtonLink href="/catalogo" variant="outline" size="lg">
            {t('orderKeepBrowsing')}
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
