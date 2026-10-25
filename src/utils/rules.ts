/**
 * Core business rules and validation utilities for ArtLoop.
 * Decoupled pure functions for reliable unit testing and server/client logic.
 */

export type ProductCondition = 'New' | 'Like New' | 'Good' | 'Fair';
export type ProductStatus = 'available' | 'reserved' | 'sold';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface ProductItem {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: ProductCondition;
  price: number;
  imageUrl: string;
  location: string;
  sellerId: string;
  status: ProductStatus;
  createdAt?: string;
}

/**
 * Validates whether a user can make a buy interest request on a product
 */
export function canExpressBuyInterest(
  product: Pick<ProductItem, 'sellerId' | 'status'>,
  userId: string | null | undefined
): { allowed: boolean; reason?: string } {
  if (!userId) {
    return { allowed: false, reason: 'Please log in to express buy interest.' };
  }
  if (product.sellerId === userId) {
    return { allowed: false, reason: 'You cannot purchase your own listing.' };
  }
  if (product.status !== 'available') {
    return { allowed: false, reason: `Item is currently ${product.status}.` };
  }
  return { allowed: true };
}

/**
 * Validates whether an item-for-item swap request can be submitted
 */
export function canRequestSwap(
  requestedProduct: Pick<ProductItem, 'id' | 'sellerId' | 'status'>,
  offeredProduct: Pick<ProductItem, 'id' | 'sellerId' | 'status'>,
  userId: string | null | undefined
): { allowed: boolean; reason?: string } {
  if (!userId) {
    return { allowed: false, reason: 'Please log in to request a swap.' };
  }
  if (requestedProduct.sellerId === userId) {
    return { allowed: false, reason: 'You cannot request a swap on your own listing.' };
  }
  if (offeredProduct.sellerId !== userId) {
    return { allowed: false, reason: 'You can only offer items from your own listings.' };
  }
  if (requestedProduct.id === offeredProduct.id) {
    return { allowed: false, reason: 'Cannot swap an item with itself.' };
  }
  if (requestedProduct.status !== 'available') {
    return { allowed: false, reason: 'The desired item is no longer available.' };
  }
  if (offeredProduct.status !== 'available') {
    return { allowed: false, reason: 'Your offered item is not available.' };
  }
  return { allowed: true };
}

/**
 * Validates transition for swap/buy requests
 */
export function isValidStatusTransition(
  currentStatus: RequestStatus,
  newStatus: RequestStatus,
  isRecipientOrSeller: boolean,
  isRequesterOrBuyer: boolean
): boolean {
  if (currentStatus === 'completed' || currentStatus === 'rejected' || currentStatus === 'cancelled') {
    return false; // Terminal states
  }

  if (currentStatus === 'pending') {
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      return isRecipientOrSeller;
    }
    if (newStatus === 'cancelled') {
      return isRequesterOrBuyer;
    }
  }

  if (currentStatus === 'accepted') {
    if (newStatus === 'completed') {
      return isRecipientOrSeller || isRequesterOrBuyer;
    }
    if (newStatus === 'cancelled') {
      return isRecipientOrSeller || isRequesterOrBuyer;
    }
  }

  return false;
}

/**
 * Formats Indian Rupee currency with standard formatting
 */
export function formatINR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  return '₹' + Math.max(0, Math.round(amount)).toLocaleString('en-IN');
}

/**
 * Filter products based on search query, category, price range, condition, and location
 */
export function filterProducts(
  products: ProductItem[],
  filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    location?: string;
    sort?: 'newest' | 'price_low' | 'price_high';
  }
): ProductItem[] {
  const searchLower = (filters.search || '').trim().toLowerCase();
  const category = (filters.category || '').trim();
  const condition = (filters.condition || '').trim();
  const location = (filters.location || '').trim().toLowerCase();
  const minPrice = filters.minPrice ?? 0;
  const maxPrice = filters.maxPrice ?? Infinity;

  const filtered = products.filter(p => {
    // Search in title and description
    if (searchLower) {
      const matchTitle = p.title.toLowerCase().includes(searchLower);
      const matchDesc = p.description.toLowerCase().includes(searchLower);
      if (!matchTitle && !matchDesc) return false;
    }

    // Category
    if (category && category !== 'All Categories' && p.category !== category) {
      return false;
    }

    // Condition
    if (condition && condition !== 'All Conditions' && p.condition !== condition) {
      return false;
    }

    // Location
    if (location && location !== 'all locations' && !p.location.toLowerCase().includes(location)) {
      return false;
    }

    // Price
    if (p.price < minPrice || p.price > maxPrice) {
      return false;
    }

    return true;
  });

  // Sorting
  if (filters.sort === 'price_low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (filters.sort === 'price_high') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    // newest by default
    filtered.sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()));
  }

  return filtered;
}

/**
 * Pure helper functions to manage search history list
 */
export function addRecentSearch(history: string[], query: string, maxItems = 5): string[] {
  const trimmed = query.trim();
  if (!trimmed) return history;
  const filtered = history.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
  return [trimmed, ...filtered].slice(0, maxItems);
}

export function removeRecentSearch(history: string[], queryToRemove: string): string[] {
  return history.filter(item => item.toLowerCase() !== queryToRemove.trim().toLowerCase());
}

/**
 * Access control and authorization checks
 */
export function canModifyProduct(sellerId: string, userId?: string | null, role?: string): boolean {
  if (!userId) return false;
  if (role === 'admin') return true;
  return sellerId === userId;
}

export function canAccessConversation(participantIds: string[], userId?: string | null, role?: string): boolean {
  if (!userId) return false;
  if (role === 'admin') return true;
  return participantIds.includes(userId);
}

export function canAccessAdminPanel(role?: string): boolean {
  return role === 'admin';
}
