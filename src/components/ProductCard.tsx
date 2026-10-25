import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { formatINR } from '../utils/rules.ts';
import { getCategoryFallbackImage } from '../utils/imageUtils.ts';
import { MapPin, Tag, Eye, Repeat } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (productId: string) => void;
  onQuickSwap?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onQuickSwap,
}) => {
  const [imageError, setImageError] = useState(false);

  // Condition color accents
  const conditionStyles: Record<string, string> = {
    New: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Like New': 'bg-blue-50 text-blue-800 border-blue-200',
    Good: 'bg-amber-50 text-amber-800 border-amber-200',
    Fair: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  const statusBadge = () => {
    if (product.status === 'sold') {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-stone-900 text-white rounded">
          Sold
        </span>
      );
    }
    if (product.status === 'reserved') {
      return (
        <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-white rounded">
          Reserved
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white rounded">
        Available
      </span>
    );
  };

  const fallbackImage = getCategoryFallbackImage(product.category);

  return (
    <div className="group bg-white rounded-xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-700/40 transition-all flex flex-col h-full">
      {/* Product Image Frame */}
      <div className="relative aspect-4/3 bg-stone-100 overflow-hidden">
        <img
          src={imageError || !product.imageUrl ? fallbackImage : product.imageUrl}
          alt={product.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          {statusBadge()}
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold border rounded ${
              conditionStyles[product.condition] || 'bg-stone-100 text-stone-800'
            }`}
          >
            {product.condition}
          </span>
        </div>

        {/* Category Pill Tag */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="px-2 py-1 text-[11px] font-medium bg-white/95 backdrop-blur-xs text-stone-800 rounded border border-stone-200/80 shadow-xs flex items-center space-x-1">
            <Tag className="w-3 h-3 text-[#C85A32]" />
            <span>{product.category}</span>
          </span>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3
            onClick={() => onViewDetails(product.id)}
            className="font-serif font-bold text-stone-900 text-base leading-snug hover:text-[#C85A32] cursor-pointer transition-colors line-clamp-1"
            title={product.title}
          >
            {product.title}
          </h3>

          <p className="text-xs text-stone-600 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Location & Seller */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span className="flex items-center space-x-1 truncate max-w-[160px]">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">{product.location}</span>
          </span>
          <span className="text-[11px] font-medium text-stone-600 truncate max-w-[100px]">
            {product.sellerName || 'Artist'}
          </span>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3.5 pt-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-400 block font-medium uppercase tracking-wider">
              Asking Price
            </span>
            <span className="text-lg font-bold text-stone-900 font-sans">
              {formatINR(product.price)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {product.status === 'available' && onQuickSwap && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickSwap(product.id);
                }}
                className="p-2 text-stone-600 hover:text-[#C85A32] hover:bg-orange-50 rounded-lg border border-stone-200 transition-colors"
                title="Propose a Swap"
                aria-label={`Propose swap for ${product.title}`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onViewDetails(product.id)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-[#C85A32] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
