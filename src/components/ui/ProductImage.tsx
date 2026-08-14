import { useState } from 'react';

interface ProductImageProps {
  src: string;
  alt: string;
  /** Primeira imagem visível da página: carrega cedo e com prioridade. */
  priority?: boolean;
  width: number;
  height: number;
  className?: string;
  sizes?: string;
}

// As imagens do catálogo vêm de um domínio de terceiros. Quando uma some, a alternativa
// é a marca em cima do fundo areia — nunca o ícone de imagem quebrada do navegador.
export function ProductImage({
  src,
  alt,
  priority = false,
  width,
  height,
  className = '',
  sizes,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-sand ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <span className="font-serif text-[15px] tracking-[.08em] text-dim">Recordare</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      onError={() => setFailed(true)}
      className={`bg-sand ${className}`}
    />
  );
}
