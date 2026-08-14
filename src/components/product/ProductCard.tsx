import { Link } from 'wouter';
import type { Product } from '../../lib/catalog';
import { useLang } from '../../i18n/lang-context';
import { categoryLabel, productBadge, productName } from '../../lib/labels';
import { Badge } from '../ui/Badge';
import { Price, Stars } from '../ui/Price';
import { ProductImage } from '../ui/ProductImage';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { lang } = useLang();
  const badge = productBadge(product, lang);

  return (
    <article className="group flex flex-col">
      <Link href={`/peca/${product.slug}`} className="flex flex-col gap-3.5">
        <div className="relative overflow-hidden rounded-[3px]">
          <ProductImage
            src={product.img}
            alt={productName(product, lang)}
            width={540}
            height={540}
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          {badge && (
            <span className="absolute top-3 left-3">
              <Badge>{badge}</Badge>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-[.22em] text-faint uppercase">
            {categoryLabel(product.cat, lang)}
          </span>
          <h3 className="font-serif text-[19px] leading-tight tracking-[-.01em] text-ink transition-colors duration-200 group-hover:text-brand">
            {productName(product, lang)}
          </h3>
          <Stars rating={product.rating} reviews={product.reviews} />
          <Price
            value={product.price}
            unit={product.unit}
            className="mt-1 text-[16px] font-semibold text-ink"
          />
        </div>
      </Link>
    </article>
  );
}
