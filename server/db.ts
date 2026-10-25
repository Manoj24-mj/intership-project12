import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  UserSchema,
  ProductSchema,
  BuyRequestSchema,
  SwapRequestSchema,
  ConversationSchema,
  MessageSchema,
  ReportSchema,
  IUser,
  IProduct,
  IBuyRequest,
  ISwapRequest,
  IConversation,
  IMessage,
  IReport,
} from './models/schemas.ts';
import { SEED_USERS, SEED_PRODUCTS } from './seeds/sampleData.ts';

// In-memory / file cache storage for seamless zero-dependency reliability
interface Store {
  users: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    location: string;
    role: 'user' | 'admin';
    accountStatus: 'active' | 'suspended';
    createdAt: string;
  }>;
  products: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    condition: 'New' | 'Like New' | 'Good' | 'Fair';
    price: number;
    imageUrl: string;
    location: string;
    sellerId: string;
    sellerName: string;
    status: 'available' | 'reserved' | 'sold';
    createdAt: string;
    updatedAt: string;
  }>;
  buyRequests: Array<{
    id: string;
    productId: string;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    productTitle: string;
    productPrice: number;
    productImageUrl: string;
    notes: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
  }>;
  swapRequests: Array<{
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
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
  }>;
  conversations: Array<{
    id: string;
    participantIds: string[];
    participantNames: Record<string, string>;
    productId?: string;
    productTitle?: string;
    lastMessage?: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
  }>;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
  }>;
  reports: Array<{
    id: string;
    productId: string;
    productTitle: string;
    reporterId: string;
    reporterName: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'dismissed';
    createdAt: string;
  }>;
}

// Global store in memory
const store: Store = {
  users: [],
  products: [],
  buyRequests: [],
  swapRequests: [],
  conversations: [],
  messages: [],
  reports: [],
};

let isConnectedToMongoDB = false;

// Mongoose Models
export let UserModel: mongoose.Model<IUser>;
export let ProductModel: mongoose.Model<IProduct>;
export let BuyRequestModel: mongoose.Model<IBuyRequest>;
export let SwapRequestModel: mongoose.Model<ISwapRequest>;
export let ConversationModel: mongoose.Model<IConversation>;
export let MessageModel: mongoose.Model<IMessage>;
export let ReportModel: mongoose.Model<IReport>;

export async function initDatabase() {
  let mongoUri = process.env.MONGODB_URI?.trim();

  if (mongoUri) {
    // Automatically strip template angle brackets if provided (e.g. :<password>@ -> :password@)
    if (mongoUri.includes(':<') && mongoUri.includes('>@')) {
      mongoUri = mongoUri.replace(':<', ':').replace('>@', '@');
    }
    // Ensure database name and options are appended if omitted
    if (mongoUri.endsWith('.mongodb.net/')) {
      mongoUri = mongoUri + 'artloop?retryWrites=true&w=majority';
    } else if (mongoUri.endsWith('.mongodb.net')) {
      mongoUri = mongoUri + '/artloop?retryWrites=true&w=majority';
    }

    try {
      console.log('Connecting to MongoDB Atlas at', mongoUri.replace(/:([^:@]+)@/, ':****@'));
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      isConnectedToMongoDB = true;
      console.log('Successfully connected to MongoDB Atlas.');

      UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
      ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
      BuyRequestModel = mongoose.models.BuyRequest || mongoose.model<IBuyRequest>('BuyRequest', BuyRequestSchema);
      SwapRequestModel = mongoose.models.SwapRequest || mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);
      ConversationModel = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
      MessageModel = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
      ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

      // Seed if empty in MongoDB
      const count = await ProductModel.countDocuments();
      if (count === 0) {
        await seedDatabase();
      }
      return;
    } catch (err) {
      console.warn('MongoDB Atlas connection failed or timed out. Falling back to built-in in-memory document engine:', err);
      isConnectedToMongoDB = false;
    }
  }

  // Seed memory store
  await seedDatabase();
  console.log('ArtLoop database initialized with realistic seed data.');
}

async function seedDatabase() {
  // Clear or initialize
  store.users = [];
  store.products = [];

  for (const u of SEED_USERS) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(u.passwordRaw, salt);
    store.users.push({
      id: u.id,
      name: u.name,
      email: u.email.toLowerCase(),
      passwordHash,
      location: u.location,
      role: u.role,
      accountStatus: u.accountStatus,
      createdAt: new Date().toISOString(),
    });
  }

  const now = new Date();
  for (let i = 0; i < SEED_PRODUCTS.length; i++) {
    const p = SEED_PRODUCTS[i];
    const dateOffset = new Date(now.getTime() - (SEED_PRODUCTS.length - i) * 3600 * 1000 * 4);
    store.products.push({
      ...p,
      createdAt: dateOffset.toISOString(),
      updatedAt: dateOffset.toISOString(),
    });
  }

  // Seed one initial conversation between Priya and Rahul for demonstration
  const convId = 'conv_demo_1';
  store.conversations.push({
    id: convId,
    participantIds: ['user_priya', 'user_rahul'],
    participantNames: {
      user_priya: 'Priya Sharma',
      user_rahul: 'Rahul Verma',
    },
    productId: 'prod_2',
    productTitle: 'Watercolour Paint Set (18 Pans)',
    lastMessage: 'Hi Rahul! Is the watercolour tin still available for pickup in Yelahanka?',
    lastMessageAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  });

  store.messages.push(
    {
      id: 'msg_1',
      conversationId: convId,
      senderId: 'user_priya',
      senderName: 'Priya Sharma',
      content: 'Hi Rahul! Is the watercolour tin still available for pickup in Yelahanka?',
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: 'msg_2',
      conversationId: convId,
      senderId: 'user_rahul',
      senderName: 'Rahul Verma',
      content: 'Yes Priya! I can bring it near the college gate tomorrow morning if that works.',
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    }
  );

  // Seed one sample buy request
  store.buyRequests.push({
    id: 'buy_demo_1',
    productId: 'prod_1',
    buyerId: 'user_rahul',
    buyerName: 'Rahul Verma',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    productTitle: 'Acrylic Paint Set, 12 Colours',
    productPrice: 250,
    productImageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    notes: 'Looking forward to trying these acrylics for a canvas study.',
    status: 'pending',
    createdAt: new Date(Date.now() - 4800 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4800 * 1000).toISOString(),
  });

  // Seed one sample swap request
  store.swapRequests.push({
    id: 'swap_demo_1',
    requestedProductId: 'prod_5', // Small Canvas Pack (Priya's)
    offeredProductId: 'prod_4',   // A3 Spiral Sketchbook (Rahul's)
    requesterId: 'user_rahul',
    requesterName: 'Rahul Verma',
    recipientId: 'user_priya',
    recipientName: 'Priya Sharma',
    requestedProductTitle: 'Small Canvas Pack (3 Pieces, 8x10 inch)',
    requestedProductImageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    offeredProductTitle: 'A3 Spiral Sketchbook (140 GSM)',
    offeredProductImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    message: 'Hey Priya, would you be interested in exchanging your small canvas boards for my A3 spiral sketchbook?',
    status: 'pending',
    createdAt: new Date(Date.now() - 5400 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5400 * 1000).toISOString(),
  });
}

// ========================
// DB DATA ACCESS METHODS
// ========================

export const db = {
  isMongoAtlas: () => isConnectedToMongoDB,

  // Users
  users: {
    find: async () => store.users.map(({ passwordHash, ...rest }) => rest),
    findByEmail: async (email: string) => store.users.find(u => u.email === email.toLowerCase()),
    findById: async (id: string) => {
      const u = store.users.find(u => u.id === id);
      if (!u) return null;
      const { passwordHash, ...rest } = u;
      return rest;
    },
    findByIdWithPassword: async (id: string) => store.users.find(u => u.id === id) || null,
    create: async (data: { name: string; email: string; passwordHash: string; location: string; role?: 'user' | 'admin' }) => {
      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        location: data.location,
        role: data.role || 'user',
        accountStatus: 'active' as const,
        createdAt: new Date().toISOString(),
      };
      store.users.push(newUser);
      const { passwordHash, ...safeUser } = newUser;
      return safeUser;
    },
    updateStatus: async (id: string, status: 'active' | 'suspended') => {
      const user = store.users.find(u => u.id === id);
      if (!user) return null;
      user.accountStatus = status;
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    },
  },

  // Products
  products: {
    find: async () => [...store.products],
    findById: async (id: string) => store.products.find(p => p.id === id) || null,
    create: async (data: Omit<Store['products'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const newProd = {
        ...data,
        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.products.unshift(newProd);
      return newProd;
    },
    update: async (id: string, updates: Partial<Store['products'][0]>) => {
      const index = store.products.findIndex(p => p.id === id);
      if (index === -1) return null;
      store.products[index] = {
        ...store.products[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return store.products[index];
    },
    updateStatus: async (id: string, status: 'available' | 'reserved' | 'sold') => {
      const prod = store.products.find(p => p.id === id);
      if (!prod) return null;
      prod.status = status;
      prod.updatedAt = new Date().toISOString();
      return prod;
    },
    delete: async (id: string) => {
      const index = store.products.findIndex(p => p.id === id);
      if (index === -1) return false;
      store.products.splice(index, 1);
      return true;
    },
  },

  // Buy Requests
  buyRequests: {
    find: async () => [...store.buyRequests],
    findById: async (id: string) => store.buyRequests.find(r => r.id === id) || null,
    create: async (data: Omit<Store['buyRequests'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const newReq = {
        ...data,
        id: 'buy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.buyRequests.unshift(newReq);
      return newReq;
    },
    updateStatus: async (id: string, status: Store['buyRequests'][0]['status']) => {
      const req = store.buyRequests.find(r => r.id === id);
      if (!req) return null;
      req.status = status;
      req.updatedAt = new Date().toISOString();
      return req;
    },
  },

  // Swap Requests
  swapRequests: {
    find: async () => [...store.swapRequests],
    findById: async (id: string) => store.swapRequests.find(r => r.id === id) || null,
    create: async (data: Omit<Store['swapRequests'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const newReq = {
        ...data,
        id: 'swap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.swapRequests.unshift(newReq);
      return newReq;
    },
    updateStatus: async (id: string, status: Store['swapRequests'][0]['status']) => {
      const req = store.swapRequests.find(r => r.id === id);
      if (!req) return null;
      req.status = status;
      req.updatedAt = new Date().toISOString();
      return req;
    },
  },

  // Conversations & Messages
  conversations: {
    findForUser: async (userId: string) => {
      return store.conversations
        .filter(c => c.participantIds.includes(userId))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    },
    findById: async (id: string) => store.conversations.find(c => c.id === id) || null,
    findOrCreate: async (participantIds: string[], participantNames: Record<string, string>, productId?: string, productTitle?: string) => {
      // Find existing
      const existing = store.conversations.find(c => {
        const matchesParticipants =
          c.participantIds.length === participantIds.length &&
          participantIds.every(id => c.participantIds.includes(id));
        if (productId) {
          return matchesParticipants && c.productId === productId;
        }
        return matchesParticipants;
      });

      if (existing) return existing;

      const newConv = {
        id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        participantIds,
        participantNames,
        productId,
        productTitle,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      store.conversations.unshift(newConv);
      return newConv;
    },
  },

  messages: {
    findByConversationId: async (conversationId: string) => {
      return store.messages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    create: async (conversationId: string, senderId: string, senderName: string, content: string) => {
      const newMsg = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        conversationId,
        senderId,
        senderName,
        content,
        createdAt: new Date().toISOString(),
      };
      store.messages.push(newMsg);

      // Update conversation last message
      const conv = store.conversations.find(c => c.id === conversationId);
      if (conv) {
        conv.lastMessage = content;
        conv.lastMessageAt = newMsg.createdAt;
        conv.updatedAt = newMsg.createdAt;
      }
      return newMsg;
    },
  },

  // Reports
  reports: {
    find: async () => [...store.reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    create: async (data: Omit<Store['reports'][0], 'id' | 'createdAt' | 'status'>) => {
      const rep = {
        ...data,
        id: 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      store.reports.unshift(rep);
      return rep;
    },
    updateStatus: async (id: string, status: 'pending' | 'reviewed' | 'dismissed') => {
      const r = store.reports.find(item => item.id === id);
      if (!r) return null;
      r.status = status;
      return r;
    },
  },

  // Admin summary statistics
  getAdminStats: async () => {
    return {
      totalUsers: store.users.length,
      activeUsers: store.users.filter(u => u.accountStatus === 'active').length,
      suspendedUsers: store.users.filter(u => u.accountStatus === 'suspended').length,
      totalListings: store.products.length,
      availableListings: store.products.filter(p => p.status === 'available').length,
      reservedListings: store.products.filter(p => p.status === 'reserved').length,
      soldListings: store.products.filter(p => p.status === 'sold').length,
      pendingBuyRequests: store.buyRequests.filter(r => r.status === 'pending').length,
      pendingSwapRequests: store.swapRequests.filter(r => r.status === 'pending').length,
      totalReports: store.reports.length,
      pendingReports: store.reports.filter(r => r.status === 'pending').length,
    };
  },
};
