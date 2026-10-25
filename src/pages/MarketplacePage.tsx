import React, { useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { api } from '../services/api.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { addRecentSearch, removeRecentSearch } from '../utils/rules.ts';
import {
  Search,
  SlidersHorizontal,
  X,
  Palette,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Tag,
  Clock,
} from 'lucide-react';

interface MarketplacePageProps {
  onViewProduct: (productId: string) => void;
  onInitiateSwap: (productId: string) => void;
  onNavigate: (page: string) => void;
}

const CATEGORIES = [
  'All Categories',
  'Paints and Colours',
  'Brushes and Painting Tools',
  'Canvas and Surfaces',
  'Sketchbooks and Paper',
  'Drawing and Sketching Tools',
  'Craft Supplies',
  'Other Art Materials',
];

const CONDITIONS = ['All Conditions', 'New', 'Like New', 'Good', 'Fair'];

const LOCATIONS = [
  'All Locations',
  'Yelahanka',
  'Rajanukunte',
  'Bengaluru Central',
  'Malleshwaram',
  'Indiranagar',
  'Koramangala',
];

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onViewProduct,
  onInitiateSwap,
  onNavigate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedCondition, setSelectedCondition] = useState('All Conditions');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Recent search history using sessionStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem('artloop_recent_searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = addRecentSearch(recentSearches, trimmed, 5);
    setRecentSearches(updated);
    try {
      sessionStorage.setItem('artloop_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore storage quota errors
    }
  };

  const handleRecentClick = (query: string) => {
    setSearchTerm(query);
    saveRecentSearch(query);
    fetchProducts(query);
  };

  const handleRemoveRecent = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(recentSearches, query);
    setRecentSearches(updated);
    try {
      sessionStorage.setItem('artloop_recent_searches', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      sessionStorage.removeItem('artloop_recent_searches');
    } catch {
      // ignore
    }
  };

  const fetchProducts = async (overrideSearch?: string) => {
    try {
      setLoading(true);
      setError(null);
      const queryToUse = typeof overrideSearch === 'string' ? overrideSearch : searchTerm;
      const params: Record<string, any> = {};
      if (queryToUse.trim()) params.search = queryToUse.trim();
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (selectedCondition !== 'All Conditions') params.condition = selectedCondition;
      if (selectedLocation !== 'All Locations') params.location = selectedLocation;
      if (minPrice !== '') params.minPrice = minPrice;
      if (maxPrice !== '') params.maxPrice = maxPrice;
      params.sort = sortBy;

      const res = await api.products.getAll(params);
      setProducts(res.products);
    } catch (err: any) {
      setError(err.message || 'Could not fetch art materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedCondition, selectedLocation, sortBy]);

  // Debounced or on-submit search
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm);
    }
    fetchProducts();
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedCondition('All Conditions');
    setSelectedLocation('All Locations');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCategory !== 'All Categories' ||
    selectedCondition !== 'All Conditions' ||
    selectedLocation !== 'All Locations' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    sortBy !== 'newest';

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      {/* Hero Banner with art aesthetic */}
      <section className="bg-gradient-to-b from-[#F5EFEB] to-[#FAF7F2] border-b border-stone-200/80 pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md bg-orange-100/80 border border-orange-200/60 text-[#C85A32] text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sustainable Studio Supplies</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-tight">
              Art Supplies Exchange & Marketplace
            </h1>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              Find paints, brushes, canvases, and sketchbooks passed forward by fellow art
              students and artists in Bengaluru. Save money, reduce landfill waste, and swap materials item-for-item.
            </p>
          </div>

          {/* Search bar & quick category chips */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-4xl">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search materials (e.g. acrylic, gouache, sketchbook, canvas)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#C85A32] focus:border-transparent shadow-xs"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#C85A32] hover:bg-[#B04C27] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Search
              </button>
            </form>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors shrink-0 ${
                  filterPanelOpen || hasActiveFilters
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters {hasActiveFilters ? '•' : ''}</span>
              </button>

              <button
                onClick={() => onNavigate('sell')}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sell Item</span>
              </button>
            </div>
          </div>

          {/* Recent Searches from sessionStorage */}
          {recentSearches.length > 0 && (
            <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs">
              <span className="flex items-center space-x-1 text-stone-600 font-medium text-[11px] mr-1">
                <Clock className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Recent Searches:</span>
              </span>
              {recentSearches.map(q => (
                <div
                  key={q}
                  className="inline-flex items-center bg-white border border-stone-300 rounded-md shadow-2xs hover:border-[#C85A32] transition-colors overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => handleRecentClick(q)}
                    className="px-2.5 py-1 text-stone-800 hover:text-[#C85A32] font-medium text-[11px]"
                    title={`Search for "${q}"`}
                  >
                    {q}
                  </button>
                  <button
                    type="button"
                    onClick={e => handleRemoveRecent(e, q)}
                    className="pr-1.5 pl-0.5 py-1 text-stone-400 hover:text-stone-700 transition-colors"
                    title={`Remove "${q}" from history`}
                    aria-label={`Remove "${q}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleClearRecent}
                className="text-[11px] text-stone-500 hover:text-red-700 underline font-medium ml-1.5"
              >
                Clear History
              </button>
            </div>
          )}

          {/* Horizontal category tabs */}
          <div className="mt-4 flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Filter Drawer / Expandable Panel */}
        {filterPanelOpen && (
          <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C85A32]" />
                <span>Refine Art Supplies</span>
              </h3>
              <div className="flex items-center space-x-3">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-[#C85A32] hover:underline font-semibold"
                  >
                    Clear All Filters
                  </button>
                )}
                <button
                  onClick={() => setFilterPanelOpen(false)}
                  className="text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-md focus:ring-1 focus:ring-[#C85A32]"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Condition</label>
                <select
                  value={selectedCondition}
                  onChange={e => setSelectedCondition(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-md focus:ring-1 focus:ring-[#C85A32]"
                >
                  {CONDITIONS.map(cond => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Locality</label>
                <select
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-md focus:ring-1 focus:ring-[#C85A32]"
                >
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Price Range (₹)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-1/2 text-xs p-2 bg-stone-50 border border-stone-300 rounded-md"
                  />
                  <span className="text-stone-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-1/2 text-xs p-2 bg-stone-50 border border-stone-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => fetchProducts()}
                className="px-4 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800"
              >
                Apply Price Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-stone-800">
              Showing {products.length} {products.length === 1 ? 'item' : 'art supplies'}
            </span>
            {hasActiveFilters && (
              <span className="text-xs text-[#C85A32] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                Filtered view
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs text-stone-500 font-medium whitespace-nowrap">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs bg-white border border-stone-300 rounded-md px-3 py-1.5 font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#C85A32]"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            <button
              onClick={() => fetchProducts()}
              className="p-1.5 text-stone-500 hover:text-stone-800 bg-white border border-stone-200 rounded-md"
              title="Refresh listings"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[#C85A32] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-stone-600 font-medium">Loading marketplace supplies...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto">
            <p className="text-sm text-red-700 font-semibold mb-2">{error}</p>
            <button
              onClick={() => fetchProducts()}
              className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#C85A32]">
              <Palette className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-stone-900 mb-2">No Art Supplies Found</h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              We couldn't find any listings matching your search or filters. Try adjusting your
              criteria or be the first to list art materials in this category!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => onNavigate('sell')}
                className="px-4 py-2 bg-[#C85A32] hover:bg-[#B04C27] text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                List Art Supplies
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={onViewProduct}
                onQuickSwap={onInitiateSwap}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
