export type ProductCondition = 'New' | 'Like New' | 'Good' | 'Fair';
export type ProductStatus = 'available' | 'reserved' | 'sold';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type UserRole = 'user' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  location: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: ProductCondition;
  price: number;
  imageUrl: string;
  location: string;
  sellerId: string;
  sellerName?: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BuyRequest {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SwapRequest {
  id: string;
  requestedProductId: string;
  offeredProductId: string;
  requesterId: string;
  requesterName: string;
  recipientId: string;
  recipientName: string;
  requestedProductTitle: string;
  requestedProductImageUrl: string;
  offeredProductTitle: string;
  offeredProductImageUrl: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: Record<string, string>;
  productId?: string;
  productTitle?: string;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface Report {
  id: string;
  productId: string;
  productTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalListings: number;
  availableListings: number;
  reservedListings: number;
  soldListings: number;
  pendingBuyRequests: number;
  pendingSwapRequests: number;
  totalReports: number;
  pendingReports: number;
}
