import { ButtonLink } from '../components/ui/Button';
import { EmptyState } from '../components/ui/Feedback';
import { Container } from '../components/ui/Layout';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useLang } from '../i18n/lang-context';

export function NotFoundPage() {
  const { t } = useLang();
  useDocumentMeta({
    title: `${t('pageNotFoundTitle')} · Recordare`,
    description: t('pageNotFoundBody'),
    noindex: true,
  });

  return (
    <Container wide={false} className="py-20">
      <EmptyState
        as="h1"
        title={t('pageNotFoundTitle')}
        body={t('pageNotFoundBody')}
        action={<ButtonLink href="/">{t('backHome')}</ButtonLink>}
      />
    </Container>
  );
}
