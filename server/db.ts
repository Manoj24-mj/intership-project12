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

// In-memory fallback / cache store
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

const store: Store = {
  users: [],
  products: [],
  buyRequests: [],
  swapRequests: [],
  conversations: [],
  messages: [],
  reports: [],
};

export let isConnectedToMongoDB = false;

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
    if (mongoUri.includes(':<') && mongoUri.includes('>@')) {
      mongoUri = mongoUri.replace(':<', ':').replace('>@', '@');
    }
    if (mongoUri.endsWith('.mongodb.net/')) {
      mongoUri = mongoUri + 'artloop?retryWrites=true&w=majority';
    } else if (mongoUri.endsWith('.mongodb.net')) {
      mongoUri = mongoUri + '/artloop?retryWrites=true&w=majority';
    }

    try {
      console.log('Connecting to MongoDB Atlas at', mongoUri.replace(/:([^:@]+)@/, ':****@'));
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      isConnectedToMongoDB = true;
      console.log('Successfully connected to MongoDB Atlas cluster.');

      UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
      ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
      BuyRequestModel = mongoose.models.BuyRequest || mongoose.model<IBuyRequest>('BuyRequest', BuyRequestSchema);
      SwapRequestModel = mongoose.models.SwapRequest || mongoose.model<ISwapRequest>('SwapRequest', SwapRequestSchema);
      ConversationModel = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
      MessageModel = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
      ReportModel = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

      const count = await ProductModel.countDocuments();
      if (count === 0) {
        console.log('Seeding initial MongoDB Atlas collections...');
        await seedDatabase(true);
      } else {
        // Also populate in-memory mirror from Mongo for ultra-fast fallback
        await syncMemoryFromMongo();
      }
      return;
    } catch (err) {
      console.warn('MongoDB Atlas connection failed or timed out. Falling back to built-in in-memory document engine:', err);
      isConnectedToMongoDB = false;
    }
  }

  // Seed memory store fallback
  await seedDatabase(false);
  console.log('ArtLoop database initialized with local document engine.');
}

async function syncMemoryFromMongo() {
  try {
    const users = await UserModel.find().lean();
    store.users = users.map(u => ({
      id: u.id || (u as any)._id.toString(),
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      location: u.location,
      role: u.role,
      accountStatus: u.accountStatus,
      createdAt: (u as any).createdAt ? (u as any).createdAt.toISOString() : new Date().toISOString(),
    }));

    const prods = await ProductModel.find().lean();
    store.products = prods.map(p => ({
      id: p.id || (p as any)._id.toString(),
      title: p.title,
      description: p.description,
      category: p.category,
      condition: p.condition,
      price: p.price,
      imageUrl: p.imageUrl,
      location: p.location,
      sellerId: p.sellerId,
      sellerName: p.sellerName || '',
      status: p.status,
      createdAt: (p as any).createdAt ? (p as any).createdAt.toISOString() : new Date().toISOString(),
      updatedAt: (p as any).updatedAt ? (p as any).updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Could not sync initial cache from Mongo:', err);
  }
}

async function seedDatabase(insertIntoMongo = false) {
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

  const convId = 'conv_demo_1';
  store.conversations = [
    {
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
    },
  ];

  store.messages = [
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
    },
  ];

  store.buyRequests = [
    {
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
    },
  ];

  store.swapRequests = [
    {
      id: 'swap_demo_1',
      requestedProductId: 'prod_5',
      offeredProductId: 'prod_4',
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
    },
  ];

  // If connected to Mongo, persist initial seed directly to Atlas
  if (insertIntoMongo && isConnectedToMongoDB) {
    try {
      await UserModel.insertMany(store.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        location: u.location,
        role: u.role,
        accountStatus: u.accountStatus,
      })));

      await ProductModel.insertMany(store.products.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        condition: p.condition,
        price: p.price,
        imageUrl: p.imageUrl,
        location: p.location,
        sellerId: p.sellerId,
        sellerName: p.sellerName,
        status: p.status,
      })));

      await ConversationModel.insertMany(store.conversations.map(c => ({
        id: c.id,
        participantIds: c.participantIds,
        participantNames: c.participantNames,
        productId: c.productId,
        productTitle: c.productTitle,
        lastMessage: c.lastMessage,
        lastMessageAt: new Date(c.lastMessageAt),
      })));

      await MessageModel.insertMany(store.messages.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
      })));

      await BuyRequestModel.insertMany(store.buyRequests.map(b => ({
        id: b.id,
        productId: b.productId,
        buyerId: b.buyerId,
        buyerName: b.buyerName,
        sellerId: b.sellerId,
        sellerName: b.sellerName,
        productTitle: b.productTitle,
        productPrice: b.productPrice,
        productImageUrl: b.productImageUrl,
        notes: b.notes,
        status: b.status,
      })));

      await SwapRequestModel.insertMany(store.swapRequests.map(s => ({
        id: s.id,
        requestedProductId: s.requestedProductId,
        offeredProductId: s.offeredProductId,
        requesterId: s.requesterId,
        requesterName: s.requesterName,
        recipientId: s.recipientId,
        recipientName: s.recipientName,
        requestedProductTitle: s.requestedProductTitle,
        requestedProductImageUrl: s.requestedProductImageUrl,
        offeredProductTitle: s.offeredProductTitle,
        offeredProductImageUrl: s.offeredProductImageUrl,
        message: s.message,
        status: s.status,
      })));

      console.log('MongoDB Atlas collections populated with seed data.');
    } catch (e) {
      console.error('Failed to populate Atlas seed:', e);
    }
  }
}

// ========================
// DB DATA ACCESS METHODS
// ========================

export const db = {
  isMongoAtlas: () => isConnectedToMongoDB,

  // Users
  users: {
    find: async () => {
      if (isConnectedToMongoDB) {
        const docs = await UserModel.find({}, { passwordHash: 0 }).lean();
        return docs.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          location: d.location,
          role: d.role,
          accountStatus: d.accountStatus,
          createdAt: (d as any).createdAt ? (d as any).createdAt.toISOString() : new Date().toISOString(),
        }));
      }
      return store.users.map(({ passwordHash, ...rest }) => rest);
    },

    findByEmail: async (email: string) => {
      const cleanEmail = email.toLowerCase().trim();
      if (isConnectedToMongoDB) {
        const u = await UserModel.findOne({ email: cleanEmail }).lean();
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          location: u.location,
          role: u.role,
          accountStatus: u.accountStatus,
          createdAt: (u as any).createdAt ? (u as any).createdAt.toISOString() : new Date().toISOString(),
        };
      }
      return store.users.find(u => u.email === cleanEmail) || null;
    },

    findById: async (id: string) => {
      if (isConnectedToMongoDB) {
        const u = await UserModel.findOne({ id }, { passwordHash: 0 }).lean();
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          location: u.location,
          role: u.role,
          accountStatus: u.accountStatus,
          createdAt: (u as any).createdAt ? (u as any).createdAt.toISOString() : new Date().toISOString(),
        };
      }
      const u = store.users.find(u => u.id === id);
      if (!u) return null;
      const { passwordHash, ...rest } = u;
      return rest;
    },

    findByIdWithPassword: async (id: string) => {
      if (isConnectedToMongoDB) {
        const u = await UserModel.findOne({ id }).lean();
        if (!u) return null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.passwordHash,
          location: u.location,
          role: u.role,
          accountStatus: u.accountStatus,
          createdAt: (u as any).createdAt ? (u as any).createdAt.toISOString() : new Date().toISOString(),
        };
      }
      return store.users.find(u => u.id === id) || null;
    },

    create: async (data: { name: string; email: string; passwordHash: string; location: string; role?: 'user' | 'admin' }) => {
      const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newUser = {
        id,
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        location: data.location,
        role: data.role || ('user' as const),
        accountStatus: 'active' as const,
        createdAt: new Date().toISOString(),
      };

      if (isConnectedToMongoDB) {
        await UserModel.create({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          passwordHash: newUser.passwordHash,
          location: newUser.location,
          role: newUser.role,
          accountStatus: newUser.accountStatus,
        });
      }

      store.users.push(newUser);
      const { passwordHash, ...safeUser } = newUser;
      return safeUser;
    },

    updateStatus: async (id: string, status: 'active' | 'suspended') => {
      if (isConnectedToMongoDB) {
        await UserModel.updateOne({ id }, { $set: { accountStatus: status } });
      }
      const user = store.users.find(u => u.id === id);
      if (user) {
        user.accountStatus = status;
      }
      return db.users.findById(id);
    },
  },

  // Products
  products: {
    find: async () => {
      if (isConnectedToMongoDB) {
        const docs = await ProductModel.find().sort({ createdAt: -1 }).lean();
        return docs.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          condition: p.condition,
          price: p.price,
          imageUrl: p.imageUrl,
          location: p.location,
          sellerId: p.sellerId,
          sellerName: p.sellerName || '',
          status: p.status,
          createdAt: (p as any).createdAt ? (p as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (p as any).updatedAt ? (p as any).updatedAt.toISOString() : new Date().toISOString(),
        }));
      }
      return [...store.products];
    },

    findById: async (id: string) => {
      if (isConnectedToMongoDB) {
        const p = await ProductModel.findOne({ id }).lean();
        if (!p) return null;
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
          condition: p.condition,
          price: p.price,
          imageUrl: p.imageUrl,
          location: p.location,
          sellerId: p.sellerId,
          sellerName: p.sellerName || '',
          status: p.status,
          createdAt: (p as any).createdAt ? (p as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (p as any).updatedAt ? (p as any).updatedAt.toISOString() : new Date().toISOString(),
        };
      }
      return store.products.find(p => p.id === id) || null;
    },

    create: async (data: Omit<Store['products'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newProd = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isConnectedToMongoDB) {
        await ProductModel.create({
          id: newProd.id,
          title: newProd.title,
          description: newProd.description,
          category: newProd.category,
          condition: newProd.condition,
          price: newProd.price,
          imageUrl: newProd.imageUrl,
          location: newProd.location,
          sellerId: newProd.sellerId,
          sellerName: newProd.sellerName,
          status: newProd.status,
        });
      }

      store.products.unshift(newProd);
      return newProd;
    },

    update: async (id: string, updates: Partial<Store['products'][0]>) => {
      const updatedAt = new Date().toISOString();
      if (isConnectedToMongoDB) {
        await ProductModel.updateOne({ id }, { $set: { ...updates, updatedAt: new Date() } });
      }

      const index = store.products.findIndex(p => p.id === id);
      if (index !== -1) {
        store.products[index] = {
          ...store.products[index],
          ...updates,
          updatedAt,
        };
      }

      return db.products.findById(id);
    },

    updateStatus: async (id: string, status: 'available' | 'reserved' | 'sold') => {
      return db.products.update(id, { status });
    },

    delete: async (id: string) => {
      if (isConnectedToMongoDB) {
        await ProductModel.deleteOne({ id });
      }
      const index = store.products.findIndex(p => p.id === id);
      if (index !== -1) {
        store.products.splice(index, 1);
      }
      return true;
    },
  },

  // Buy Requests
  buyRequests: {
    find: async () => {
      if (isConnectedToMongoDB) {
        const docs = await BuyRequestModel.find().sort({ createdAt: -1 }).lean();
        return docs.map(r => ({
          id: r.id,
          productId: r.productId,
          buyerId: r.buyerId,
          buyerName: r.buyerName || '',
          sellerId: r.sellerId,
          sellerName: r.sellerName || '',
          productTitle: r.productTitle || '',
          productPrice: r.productPrice || 0,
          productImageUrl: r.productImageUrl || '',
          notes: r.notes || '',
          status: r.status,
          createdAt: (r as any).createdAt ? (r as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (r as any).updatedAt ? (r as any).updatedAt.toISOString() : new Date().toISOString(),
        }));
      }
      return [...store.buyRequests];
    },

    findById: async (id: string) => {
      if (isConnectedToMongoDB) {
        const r = await BuyRequestModel.findOne({ id }).lean();
        if (!r) return null;
        return {
          id: r.id,
          productId: r.productId,
          buyerId: r.buyerId,
          buyerName: r.buyerName || '',
          sellerId: r.sellerId,
          sellerName: r.sellerName || '',
          productTitle: r.productTitle || '',
          productPrice: r.productPrice || 0,
          productImageUrl: r.productImageUrl || '',
          notes: r.notes || '',
          status: r.status,
          createdAt: (r as any).createdAt ? (r as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (r as any).updatedAt ? (r as any).updatedAt.toISOString() : new Date().toISOString(),
        };
      }
      return store.buyRequests.find(r => r.id === id) || null;
    },

    create: async (data: Omit<Store['buyRequests'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = 'buy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newReq = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isConnectedToMongoDB) {
        await BuyRequestModel.create({
          id: newReq.id,
          productId: newReq.productId,
          buyerId: newReq.buyerId,
          buyerName: newReq.buyerName,
          sellerId: newReq.sellerId,
          sellerName: newReq.sellerName,
          productTitle: newReq.productTitle,
          productPrice: newReq.productPrice,
          productImageUrl: newReq.productImageUrl,
          notes: newReq.notes,
          status: newReq.status,
        });
      }

      store.buyRequests.unshift(newReq);
      return newReq;
    },

    updateStatus: async (id: string, status: Store['buyRequests'][0]['status']) => {
      const updatedAt = new Date().toISOString();
      if (isConnectedToMongoDB) {
        await BuyRequestModel.updateOne({ id }, { $set: { status, updatedAt: new Date() } });
      }

      const req = store.buyRequests.find(r => r.id === id);
      if (req) {
        req.status = status;
        req.updatedAt = updatedAt;
      }
      return db.buyRequests.findById(id);
    },
  },

  // Swap Requests
  swapRequests: {
    find: async () => {
      if (isConnectedToMongoDB) {
        const docs = await SwapRequestModel.find().sort({ createdAt: -1 }).lean();
        return docs.map(r => ({
          id: r.id,
          requestedProductId: r.requestedProductId,
          offeredProductId: r.offeredProductId,
          requesterId: r.requesterId,
          requesterName: r.requesterName || '',
          recipientId: r.recipientId,
          recipientName: r.recipientName || '',
          requestedProductTitle: r.requestedProductTitle || '',
          requestedProductImageUrl: r.requestedProductImageUrl || '',
          offeredProductTitle: r.offeredProductTitle || '',
          offeredProductImageUrl: r.offeredProductImageUrl || '',
          message: r.message || '',
          status: r.status,
          createdAt: (r as any).createdAt ? (r as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (r as any).updatedAt ? (r as any).updatedAt.toISOString() : new Date().toISOString(),
        }));
      }
      return [...store.swapRequests];
    },

    findById: async (id: string) => {
      if (isConnectedToMongoDB) {
        const r = await SwapRequestModel.findOne({ id }).lean();
        if (!r) return null;
        return {
          id: r.id,
          requestedProductId: r.requestedProductId,
          offeredProductId: r.offeredProductId,
          requesterId: r.requesterId,
          requesterName: r.requesterName || '',
          recipientId: r.recipientId,
          recipientName: r.recipientName || '',
          requestedProductTitle: r.requestedProductTitle || '',
          requestedProductImageUrl: r.requestedProductImageUrl || '',
          offeredProductTitle: r.offeredProductTitle || '',
          offeredProductImageUrl: r.offeredProductImageUrl || '',
          message: r.message || '',
          status: r.status,
          createdAt: (r as any).createdAt ? (r as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (r as any).updatedAt ? (r as any).updatedAt.toISOString() : new Date().toISOString(),
        };
      }
      return store.swapRequests.find(r => r.id === id) || null;
    },

    create: async (data: Omit<Store['swapRequests'][0], 'id' | 'createdAt' | 'updatedAt'>) => {
      const id = 'swap_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newReq = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isConnectedToMongoDB) {
        await SwapRequestModel.create({
          id: newReq.id,
          requestedProductId: newReq.requestedProductId,
          offeredProductId: newReq.offeredProductId,
          requesterId: newReq.requesterId,
          requesterName: newReq.requesterName,
          recipientId: newReq.recipientId,
          recipientName: newReq.recipientName,
          requestedProductTitle: newReq.requestedProductTitle,
          requestedProductImageUrl: newReq.requestedProductImageUrl,
          offeredProductTitle: newReq.offeredProductTitle,
          offeredProductImageUrl: newReq.offeredProductImageUrl,
          message: newReq.message,
          status: newReq.status,
        });
      }

      store.swapRequests.unshift(newReq);
      return newReq;
    },

    updateStatus: async (id: string, status: Store['swapRequests'][0]['status']) => {
      const updatedAt = new Date().toISOString();
      if (isConnectedToMongoDB) {
        await SwapRequestModel.updateOne({ id }, { $set: { status, updatedAt: new Date() } });
      }

      const req = store.swapRequests.find(r => r.id === id);
      if (req) {
        req.status = status;
        req.updatedAt = updatedAt;
      }
      return db.swapRequests.findById(id);
    },
  },

  // Conversations & Messages
  conversations: {
    findForUser: async (userId: string) => {
      if (isConnectedToMongoDB) {
        const docs = await ConversationModel.find({ participantIds: userId }).sort({ lastMessageAt: -1 }).lean();
        return docs.map(c => ({
          id: c.id,
          participantIds: c.participantIds,
          participantNames: c.participantNames ? (c.participantNames instanceof Map ? Object.fromEntries(c.participantNames) : (c.participantNames as Record<string, string>)) : {},
          productId: c.productId,
          productTitle: c.productTitle,
          lastMessage: c.lastMessage,
          lastMessageAt: (c as any).lastMessageAt ? (c as any).lastMessageAt.toISOString() : new Date().toISOString(),
          createdAt: (c as any).createdAt ? (c as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (c as any).updatedAt ? (c as any).updatedAt.toISOString() : new Date().toISOString(),
        }));
      }

      return store.conversations
        .filter(c => c.participantIds.includes(userId))
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    },

    findById: async (id: string) => {
      if (isConnectedToMongoDB) {
        const c = await ConversationModel.findOne({ id }).lean();
        if (!c) return null;
        return {
          id: c.id,
          participantIds: c.participantIds,
          participantNames: c.participantNames ? (c.participantNames instanceof Map ? Object.fromEntries(c.participantNames) : (c.participantNames as Record<string, string>)) : {},
          productId: c.productId,
          productTitle: c.productTitle,
          lastMessage: c.lastMessage,
          lastMessageAt: (c as any).lastMessageAt ? (c as any).lastMessageAt.toISOString() : new Date().toISOString(),
          createdAt: (c as any).createdAt ? (c as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (c as any).updatedAt ? (c as any).updatedAt.toISOString() : new Date().toISOString(),
        };
      }
      return store.conversations.find(c => c.id === id) || null;
    },

    findOrCreate: async (participantIds: string[], participantNames: Record<string, string>, productId?: string, productTitle?: string) => {
      const sortedIds = [...participantIds].sort();

      if (isConnectedToMongoDB) {
        const query: any = { participantIds: { $all: sortedIds, $size: sortedIds.length } };
        if (productId) {
          query.productId = productId;
        }
        const existing = await ConversationModel.findOne(query).lean();
        if (existing) {
          return {
            id: existing.id,
            participantIds: existing.participantIds,
            participantNames: existing.participantNames ? (existing.participantNames instanceof Map ? Object.fromEntries(existing.participantNames) : (existing.participantNames as Record<string, string>)) : {},
            productId: existing.productId,
            productTitle: existing.productTitle,
            lastMessage: existing.lastMessage,
            lastMessageAt: (existing as any).lastMessageAt ? (existing as any).lastMessageAt.toISOString() : new Date().toISOString(),
            createdAt: (existing as any).createdAt ? (existing as any).createdAt.toISOString() : new Date().toISOString(),
            updatedAt: (existing as any).updatedAt ? (existing as any).updatedAt.toISOString() : new Date().toISOString(),
          };
        }

        const id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const created = await ConversationModel.create({
          id,
          participantIds: sortedIds,
          participantNames,
          productId,
          productTitle,
          lastMessage: 'Conversation started',
          lastMessageAt: new Date(),
        });

        return {
          id: created.id,
          participantIds: created.participantIds,
          participantNames,
          productId,
          productTitle,
          lastMessage: created.lastMessage,
          lastMessageAt: created.lastMessageAt ? created.lastMessageAt.toISOString() : new Date().toISOString(),
          createdAt: (created as any).createdAt ? (created as any).createdAt.toISOString() : new Date().toISOString(),
          updatedAt: (created as any).updatedAt ? (created as any).updatedAt.toISOString() : new Date().toISOString(),
        };
      }

      // In-memory fallback
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
      if (isConnectedToMongoDB) {
        const docs = await MessageModel.find({ conversationId }).sort({ createdAt: 1 }).lean();
        return docs.map(m => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: m.senderName,
          content: m.content,
          createdAt: (m as any).createdAt ? (m as any).createdAt.toISOString() : new Date().toISOString(),
        }));
      }

      return store.messages
        .filter(m => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    create: async (conversationId: string, senderId: string, senderName: string, content: string) => {
      const id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newMsg = {
        id,
        conversationId,
        senderId,
        senderName,
        content,
        createdAt: new Date().toISOString(),
      };

      if (isConnectedToMongoDB) {
        await MessageModel.create({
          id: newMsg.id,
          conversationId: newMsg.conversationId,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName,
          content: newMsg.content,
        });

        await ConversationModel.updateOne(
          { id: conversationId },
          { $set: { lastMessage: content, lastMessageAt: new Date() } }
        );
      }

      store.messages.push(newMsg);
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
    find: async () => {
      if (isConnectedToMongoDB) {
        const docs = await ReportModel.find().sort({ createdAt: -1 }).lean();
        return docs.map(r => ({
          id: r.id,
          productId: r.productId,
          productTitle: r.productTitle,
          reporterId: r.reporterId,
          reporterName: r.reporterName,
          reason: r.reason,
          status: r.status,
          createdAt: (r as any).createdAt ? (r as any).createdAt.toISOString() : new Date().toISOString(),
        }));
      }

      return [...store.reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    create: async (data: Omit<Store['reports'][0], 'id' | 'createdAt' | 'status'>) => {
      const id = 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const rep = {
        ...data,
        id,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      if (isConnectedToMongoDB) {
        await ReportModel.create({
          id: rep.id,
          productId: rep.productId,
          productTitle: rep.productTitle,
          reporterId: rep.reporterId,
          reporterName: rep.reporterName,
          reason: rep.reason,
          status: rep.status,
        });
      }

      store.reports.unshift(rep);
      return rep;
    },

    updateStatus: async (id: string, status: 'pending' | 'reviewed' | 'dismissed') => {
      if (isConnectedToMongoDB) {
        await ReportModel.updateOne({ id }, { $set: { status } });
      }

      const r = store.reports.find(item => item.id === id);
      if (r) {
        r.status = status;
      }
      return r || null;
    },
  },

  // Admin summary statistics
  getAdminStats: async () => {
    if (isConnectedToMongoDB) {
      const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalListings,
        availableListings,
        reservedListings,
        soldListings,
        pendingBuyRequests,
        pendingSwapRequests,
        totalReports,
        pendingReports,
      ] = await Promise.all([
        UserModel.countDocuments(),
        UserModel.countDocuments({ accountStatus: 'active' }),
        UserModel.countDocuments({ accountStatus: 'suspended' }),
        ProductModel.countDocuments(),
        ProductModel.countDocuments({ status: 'available' }),
        ProductModel.countDocuments({ status: 'reserved' }),
        ProductModel.countDocuments({ status: 'sold' }),
        BuyRequestModel.countDocuments({ status: 'pending' }),
        SwapRequestModel.countDocuments({ status: 'pending' }),
        ReportModel.countDocuments(),
        ReportModel.countDocuments({ status: 'pending' }),
      ]);

      return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalListings,
        availableListings,
        reservedListings,
        soldListings,
        pendingBuyRequests,
        pendingSwapRequests,
        totalReports,
        pendingReports,
      };
    }

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
