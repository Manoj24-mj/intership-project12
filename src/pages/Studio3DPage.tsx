import React, { useEffect, useState } from 'react';
import { ThreeStudioScene } from '../components/ThreeStudioScene.tsx';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ArrowLeft, Box } from 'lucide-react';

interface Studio3DPageProps {
  initialProductId?: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onViewProduct: (productId: string) => void;
}

export const Studio3DPage: React.FC<Studio3DPageProps> = ({
  initialProductId,
  onNavigate,
  onViewProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.products.getAll();
        setProducts(res.products);
      } catch (e) {
        console.error('Failed to load products for 3D studio:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] bg-[#191817] flex items-center justify-center text-stone-300">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold tracking-wider uppercase text-stone-400">
            Initializing 3D WebGL Studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-64px)] bg-[#191817]">
      <ThreeStudioScene
        products={products}
        selectedProductId={initialProductId}
        onSelectProduct={id => onViewProduct(id)}
        onClose={() => onNavigate('marketplace')}
      />
    </div>
  );
};
