import { Helmet } from 'react-helmet-async';

/**
 * Meta SEO per halaman (title, description, Open Graph).
 * Pemakaian: <Seo title="Tentang Kami" description="..." />
 * Tanpa props → memakai judul default yayasan.
 */
export default function Seo({ title, description }) {
  const fullTitle = title ? `${title} — Cinta Kasih Fatimah` : 'Cinta Kasih Fatimah';
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description ? (
        <>
          <meta name="description" content={description} />
          <meta property="og:description" content={description} />
        </>
      ) : null}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
    </Helmet>
  );
}
