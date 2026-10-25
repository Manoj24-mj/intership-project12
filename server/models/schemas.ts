import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  location: string;
  role: 'user' | 'admin';
  accountStatus: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

// Product Schema
export interface IProduct extends Document {
  title: string;
  description: string;
  category: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  price: number;
  imageUrl: string;
  location: string;
  sellerId: string;
  sellerName?: string;
  status: 'available' | 'reserved' | 'sold';
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Paints and Colours',
        'Brushes and Painting Tools',
        'Canvas and Surfaces',
        'Sketchbooks and Paper',
        'Drawing and Sketching Tools',
        'Craft Supplies',
        'Other Art Materials',
      ],
    },
    condition: {
      type: String,
      required: true,
      enum: ['New', 'Like New', 'Good', 'Fair'],
    },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    sellerId: { type: String, required: true },
    sellerName: { type: String },
    status: {
      type: String,
      enum: ['available', 'reserved', 'sold'],
      default: 'available',
    },
  },
  { timestamps: true }
);

// Buy Request / Transaction Schema
export interface IBuyRequest extends Document {
  productId: string;
  buyerId: string;
  buyerName?: string;
  sellerId: string;
  sellerName?: string;
  productTitle?: string;
  productPrice?: number;
  productImageUrl?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export const BuyRequestSchema = new Schema<IBuyRequest>(
  {
    productId: { type: String, required: true },
    buyerId: { type: String, required: true },
    buyerName: { type: String },
    sellerId: { type: String, required: true },
    sellerName: { type: String },
    productTitle: { type: String },
    productPrice: { type: Number },
    productImageUrl: { type: String },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Swap Request Schema
export interface ISwapRequest extends Document {
  requestedProductId: string;
  offeredProductId: string;
  requesterId: string;
  requesterName?: string;
  recipientId: string;
  recipientName?: string;
  requestedProductTitle?: string;
  requestedProductImageUrl?: string;
  offeredProductTitle?: string;
  offeredProductImageUrl?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export const SwapRequestSchema = new Schema<ISwapRequest>(
  {
    requestedProductId: { type: String, required: true },
    offeredProductId: { type: String, required: true },
    requesterId: { type: String, required: true },
    requesterName: { type: String },
    recipientId: { type: String, required: true },
    recipientName: { type: String },
    requestedProductTitle: { type: String },
    requestedProductImageUrl: { type: String },
    offeredProductTitle: { type: String },
    offeredProductImageUrl: { type: String },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Conversation Schema
export interface IConversation extends Document {
  participantIds: string[];
  participantNames?: Record<string, string>;
  productId?: string;
  productTitle?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = new Schema<IConversation>(
  {
    participantIds: [{ type: String, required: true }],
    participantNames: { type: Map, of: String },
    productId: { type: String },
    productTitle: { type: String },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Message Schema
export interface IMessage extends Document {
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

export const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Listing Report Schema
export interface IReport extends Document {
  productId: string;
  productTitle: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: Date;
}

export const ReportSchema = new Schema<IReport>(
  {
    productId: { type: String, required: true },
    productTitle: { type: String, required: true },
    reporterId: { type: String, required: true },
    reporterName: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);
