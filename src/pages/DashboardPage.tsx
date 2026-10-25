import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, SwapRequest, BuyRequest } from '../types/index.ts';
import { api } from '../services/api.ts';
import { formatINR } from '../utils/rules.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import {
  Palette,
  ShoppingBag,
  Repeat,
  PlusCircle,
  MessageSquare,
  Package,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onViewProduct: (productId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onViewProduct,
}) => {
  const { user } = useAuth();
  const [marketProducts, setMarketProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        // All marketplace products
        const allRes = await api.products.getAll();
        setMarketProducts(allRes.products);

        if (user) {
          // My products
          const myRes = await api.products.getAll({ sellerId: user.id });
          setMyProducts(myRes.products);

          // Swaps
          const swapRes = await api.swapRequests.getAll();
          setSwaps(swapRes.swaps);

          // Buy requests
          const buyRes = await api.buyRequests.getAll();
          setBuyRequests(buyRes.requests);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center max-w-md shadow-xs">
          <Palette className="w-12 h-12 text-[#C85A32] mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-2">Welcome to ArtLoop</h2>
          <p className="text-xs text-stone-600 mb-6">
            Sign in to track your art supplies, exchange proposals, and active purchases.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 bg-[#C85A32] text-white rounded-lg text-xs font-semibold shadow-xs"
          >
            Sign In or Register
          </button>
        </div>
      </div>
    );
  }

  const availableMarketCount = marketProducts.filter(p => p.status === 'available').length;
  const myListingsCount = myProducts.length;
  const pendingSwapsCount = swaps.filter(
    s => s.status === 'pending' && s.recipientId === user.id
  ).length;
  const pendingBuysCount = buyRequests.filter(
    r => r.status === 'pending' && r.sellerId === user.id
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-b from-[#F5EFEB] to-[#FAF7F2] border-b border-stone-200/80 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-stone-100 text-stone-700 text-xs font-semibold uppercase tracking-wider mb-2">
              <MapPin className="w-3 h-3 text-[#C85A32]" />
              <span>{user.location} • Studio Workspace</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
              Welcome back, {user.name}!
            </h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Here is what is happening with your art supply inventory and exchange proposals today.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('sell')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-[#C85A32] hover:bg-[#B04C27] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Supply</span>
            </button>
            <button
              onClick={() => onNavigate('marketplace')}
              className="flex items-center space-x-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('marketplace')}
            className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-amber-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Community Items
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#C85A32] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-stone-900">{availableMarketCount}</div>
            <p className="text-[11px] text-stone-500 mt-1">Available for exchange or buy</p>
          </div>

          <div
            onClick={() => onNavigate('sell')}
            className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-amber-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                My Listed Materials
              </span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-stone-900">{myListingsCount}</div>
            <p className="text-[11px] text-stone-500 mt-1">Active studio items</p>
          </div>

          <div
            onClick={() => onNavigate('swaps')}
            className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-amber-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Incoming Swaps
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Repeat className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-stone-900">{pendingSwapsCount}</div>
            <p className="text-[11px] text-stone-500 mt-1">Pending your response</p>
          </div>

          <div
            onClick={() => onNavigate('deals')}
            className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-amber-400 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Incoming Buys
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-stone-900">{pendingBuysCount}</div>
            <p className="text-[11px] text-stone-500 mt-1">Pending buyer requests</p>
          </div>
        </div>

        {/* Action alert banner if pending requests */}
        {(pendingSwapsCount > 0 || pendingBuysCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  You have pending student requests to review!
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {pendingSwapsCount > 0 && `${pendingSwapsCount} swap proposals awaiting your decision. `}
                  {pendingBuysCount > 0 && `${pendingBuysCount} buy interests received for your art supplies.`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {pendingSwapsCount > 0 && (
                <button
                  onClick={() => onNavigate('swaps')}
                  className="px-3.5 py-1.5 bg-[#C85A32] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Review Swaps
                </button>
              )}
              {pendingBuysCount > 0 && (
                <button
                  onClick={() => onNavigate('deals')}
                  className="px-3.5 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Review Buys
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Hub Navigation Cards */}
        <div>
          <h2 className="font-serif font-bold text-xl text-stone-900 mb-4">Marketplace Quick Hub</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <button
              onClick={() => onNavigate('marketplace')}
              className="p-4 bg-white rounded-xl border border-stone-200/90 text-left hover:border-[#C85A32] transition-colors group shadow-xs"
            >
              <ShoppingBag className="w-5 h-5 text-[#C85A32] mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-xs text-stone-900">Browse Supplies</h4>
              <p className="text-[11px] text-stone-500 mt-0.5">Search 7 art categories</p>
            </button>

            <button
              onClick={() => onNavigate('sell')}
              className="p-4 bg-white rounded-xl border border-stone-200/90 text-left hover:border-[#C85A32] transition-colors group shadow-xs"
            >
              <PlusCircle className="w-5 h-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-xs text-stone-900">Sell Art Supplies</h4>
              <p className="text-[11px] text-stone-500 mt-0.5">List unused studio items</p>
            </button>

            <button
              onClick={() => onNavigate('swaps')}
              className="p-4 bg-white rounded-xl border border-stone-200/90 text-left hover:border-[#C85A32] transition-colors group shadow-xs"
            >
              <Repeat className="w-5 h-5 text-blue-700 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-xs text-stone-900">Swap Requests</h4>
              <p className="text-[11px] text-stone-500 mt-0.5">Barter materials item-for-item</p>
            </button>

            <button
              onClick={() => onNavigate('chat')}
              className="p-4 bg-white rounded-xl border border-stone-200/90 text-left hover:border-[#C85A32] transition-colors group shadow-xs"
            >
              <MessageSquare className="w-5 h-5 text-purple-700 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-xs text-stone-900">Studio Messages</h4>
              <p className="text-[11px] text-stone-500 mt-0.5">Talk to buyers & sellers</p>
            </button>
          </div>
        </div>

        {/* Recent Marketplace Additions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900">Fresh Art Supplies</h2>
              <p className="text-xs text-stone-500">Recently listed by artists in your area</p>
            </div>
            <button
              onClick={() => onNavigate('marketplace')}
              className="text-xs font-semibold text-[#C85A32] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {marketProducts.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewProduct}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
