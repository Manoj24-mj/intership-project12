import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import {
  canExpressBuyInterest,
  canRequestSwap,
  isValidStatusTransition,
  filterProducts,
  type RequestStatus,
} from '../../src/utils/rules.ts';

export const apiRouter = Router();

// Extend Request type to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    location: string;
    role: 'user' | 'admin';
    accountStatus: 'active' | 'suspended';
  };
}

// Authentication middleware using cookie or Authorization header
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check cookie or header
    let userId = req.cookies?.artloop_user_id;
    if (!userId && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        userId = parts[1];
      }
    }

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const user = await db.users.findById(userId);
    if (!user) {
      return res.status(401).json({ error: 'User session invalid. Please log in again.' });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'Your account is currently suspended. Please contact administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal authentication error.' });
  }
}

// Optional Auth (for populating user if logged in, but not blocking guests)
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let userId = req.cookies?.artloop_user_id;
    if (!userId && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        userId = parts[1];
      }
    }

    if (userId) {
      const user = await db.users.findById(userId);
      if (user && user.accountStatus !== 'suspended') {
        req.user = user;
      }
    }
  } catch {
    // ignore
  }
  next();
}

// Admin only middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword ?? req.body.password;
    const location = req.body.location || req.body.locality;

    if (!name || !email || !password || !location) {
      return res.status(400).json({ error: 'All fields (name, email, password, location) are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Check duplicate
    const existing = await db.users.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.users.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      location: location.trim(),
      role: 'user',
    });

    // Set cookie
    res.cookie('artloop_user_id', newUser.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account created successfully!',
      user: newUser,
      token: newUser.id,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userWithPw = await db.users.findByEmail(email);
    if (!userWithPw) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (userWithPw.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by administration.' });
    }

    const isMatch = await bcrypt.compare(password, userWithPw.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { passwordHash, ...safeUser } = userWithPw;

    res.cookie('artloop_user_id', safeUser.id, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Logged in successfully!',
      user: safeUser,
      token: safeUser.id,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Logout
apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('artloop_user_id');
  res.json({ message: 'Logged out successfully.' });
});

// Get Current User
apiRouter.get('/auth/me', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(200).json({ user: null });
  }
  res.json({ user: req.user });
});

// ==========================================
// 2. PRODUCT ROUTES
// ==========================================

// Get Products with filtering & sorting
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const allProducts = await db.products.find();
    const { search, category, minPrice, maxPrice, condition, location, sort, sellerId } = req.query;

    let items = allProducts;
    if (sellerId) {
      items = items.filter(p => p.sellerId === String(sellerId));
    }

    const filtered = filterProducts(items as any, {
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      condition: condition ? String(condition) : undefined,
      location: location ? String(location) : undefined,
      sort: (sort as any) || 'newest',
    });

    res.json({ products: filtered, count: filtered.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Get Single Product
apiRouter.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product details.' });
  }
});

// Create Product
apiRouter.post('/products', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, category, condition, price, location } = req.body;
    const imageUrl = req.body.imageUrl || (Array.isArray(req.body.images) ? req.body.images[0] : req.body.image) || 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80';

    if (!title || !description || !category || !condition || price === undefined || !location) {
      return res.status(400).json({ error: 'Title, description, category, condition, price, and location are required.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'Price must be a valid positive number.' });
    }

    const validConditions = ['New', 'Like New', 'Good', 'Fair'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({ error: 'Condition must be New, Like New, Good, or Fair.' });
    }

    const validCategories = [
      'Paints and Colours',
      'Brushes and Painting Tools',
      'Canvas and Surfaces',
      'Sketchbooks and Paper',
      'Drawing and Sketching Tools',
      'Craft Supplies',
      'Other Art Materials',
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Please choose a valid art category.' });
    }

    const newProduct = await db.products.create({
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      price: numPrice,
      imageUrl: imageUrl.trim(),
      location: location.trim(),
      sellerId: req.user!.id,
      sellerName: req.user!.name,
      status: 'available',
    });

    res.status(201).json({ message: 'Product listed successfully!', product: newProduct });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product listing.' });
  }
});

// Update Product
apiRouter.put('/products/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await db.products.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Must be seller or admin
    if (existing.sellerId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to edit this listing.' });
    }

    const { title, description, category, condition, price, imageUrl, location } = req.body;
    const numPrice = price !== undefined ? Number(price) : existing.price;

    if (numPrice < 0) {
      return res.status(400).json({ error: 'Price cannot be negative.' });
    }

    const updated = await db.products.update(req.params.id, {
      title: title ? title.trim() : existing.title,
      description: description ? description.trim() : existing.description,
      category: category || existing.category,
      condition: condition || existing.condition,
      price: numPrice,
      imageUrl: imageUrl ? imageUrl.trim() : existing.imageUrl,
      location: location ? location.trim() : existing.location,
    });

    res.json({ message: 'Product updated successfully!', product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Update Product Status (available, reserved, sold)
apiRouter.patch('/products/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['available', 'reserved', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Status must be available, reserved, or sold.' });
    }

    const existing = await db.products.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.sellerId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this listing.' });
    }

    const updated = await db.products.updateStatus(req.params.id, status);
    res.json({ message: `Listing marked as ${status}.`, product: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update listing status.' });
  }
});

// Delete Product
apiRouter.delete('/products/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await db.products.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (existing.sellerId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to delete this listing.' });
    }

    await db.products.delete(req.params.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// ==========================================
// 3. BUY REQUESTS / PURCHASE INTEREST
// ==========================================

// Create Buy Interest Request
apiRouter.post('/buy-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, notes } = req.body;
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required.' });
    }

    const product = await db.products.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const check = canExpressBuyInterest(product as any, req.user!.id);
    if (!check.allowed) {
      return res.status(400).json({ error: check.reason });
    }

    // Prevent duplicate pending request
    const allRequests = await db.buyRequests.find();
    const duplicate = allRequests.find(
      r => r.productId === productId && r.buyerId === req.user!.id && r.status === 'pending'
    );
    if (duplicate) {
      return res.status(400).json({ error: 'You already have an active pending buy request for this item.' });
    }

    const newRequest = await db.buyRequests.create({
      productId: product.id,
      buyerId: req.user!.id,
      buyerName: req.user!.name,
      sellerId: product.sellerId,
      sellerName: product.sellerName || 'Seller',
      productTitle: product.title,
      productPrice: product.price,
      productImageUrl: product.imageUrl,
      notes: notes ? notes.trim() : '',
      status: 'pending',
    });

    // Also initiate or notify in conversation
    const conv = await db.conversations.findOrCreate(
      [req.user!.id, product.sellerId],
      {
        [req.user!.id]: req.user!.name,
        [product.sellerId]: product.sellerName || 'Seller',
      },
      product.id,
      product.title
    );

    await db.messages.create(
      conv.id,
      req.user!.id,
      req.user!.name,
      `Hello! I expressed buy interest for "${product.title}" (₹${product.price}). ${notes ? 'Note: ' + notes : 'Let us coordinate pickup/payment!'}`
    );

    res.status(201).json({
      message: 'Buy interest expressed! Seller will see your request.',
      request: newRequest,
      conversationId: conv.id,
    });
  } catch (err) {
    console.error('Buy request error:', err);
    res.status(500).json({ error: 'Failed to submit buy interest request.' });
  }
});

// Get Buy Requests (as buyer or seller)
apiRouter.get('/buy-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const all = await db.buyRequests.find();
    const userRequests = all.filter(
      r => r.buyerId === req.user!.id || r.sellerId === req.user!.id
    );
    res.json({ requests: userRequests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch buy requests.' });
  }
});

// Update Buy Request Status
apiRouter.patch('/buy-requests/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const request = await db.buyRequests.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const isSeller = request.sellerId === req.user!.id;
    const isBuyer = request.buyerId === req.user!.id;

    if (!isSeller && !isBuyer && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a participant in this transaction.' });
    }

    const isValid = isValidStatusTransition(
      request.status,
      status as RequestStatus,
      isSeller,
      isBuyer
    );

    if (!isValid && req.user!.role !== 'admin') {
      return res.status(400).json({ error: 'Invalid state transition for your role.' });
    }

    const updated = await db.buyRequests.updateStatus(req.params.id, status);

    // If accepted or completed, update product availability
    if (status === 'accepted') {
      await db.products.updateStatus(request.productId, 'reserved');
    } else if (status === 'completed') {
      await db.products.updateStatus(request.productId, 'sold');
    } else if (status === 'rejected' || status === 'cancelled') {
      // If product was reserved for this, restore to available
      const currentProd = await db.products.findById(request.productId);
      if (currentProd && currentProd.status === 'reserved') {
        await db.products.updateStatus(request.productId, 'available');
      }
    }

    res.json({ message: `Request updated to ${status}.`, request: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request status.' });
  }
});

// ==========================================
// 4. SWAP REQUESTS (ITEM-FOR-ITEM)
// ==========================================

// Create Swap Request
apiRouter.post('/swap-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestedProductId, offeredProductId, message } = req.body;

    if (!requestedProductId || !offeredProductId) {
      return res.status(400).json({ error: 'Both desired item and offered item are required.' });
    }

    const reqProduct = await db.products.findById(requestedProductId);
    const offeredProduct = await db.products.findById(offeredProductId);

    if (!reqProduct || !offeredProduct) {
      return res.status(404).json({ error: 'One or both items could not be found.' });
    }

    const check = canRequestSwap(reqProduct as any, offeredProduct as any, req.user!.id);
    if (!check.allowed) {
      return res.status(400).json({ error: check.reason });
    }

    const newSwap = await db.swapRequests.create({
      requestedProductId: reqProduct.id,
      offeredProductId: offeredProduct.id,
      requesterId: req.user!.id,
      requesterName: req.user!.name,
      recipientId: reqProduct.sellerId,
      recipientName: reqProduct.sellerName || 'Artist',
      requestedProductTitle: reqProduct.title,
      requestedProductImageUrl: reqProduct.imageUrl,
      offeredProductTitle: offeredProduct.title,
      offeredProductImageUrl: offeredProduct.imageUrl,
      message: message ? message.trim() : '',
      status: 'pending',
    });

    // Start conversation for chat coordination
    const conv = await db.conversations.findOrCreate(
      [req.user!.id, reqProduct.sellerId],
      {
        [req.user!.id]: req.user!.name,
        [reqProduct.sellerId]: reqProduct.sellerName || 'Artist',
      },
      reqProduct.id,
      reqProduct.title
    );

    await db.messages.create(
      conv.id,
      req.user!.id,
      req.user!.name,
      `Hello! I proposed a swap: my "${offeredProduct.title}" for your "${reqProduct.title}". ${message ? 'Message: ' + message : 'Let me know if you are interested!'}`
    );

    res.status(201).json({
      message: 'Swap request submitted to item owner!',
      swap: newSwap,
      conversationId: conv.id,
    });
  } catch (err) {
    console.error('Swap request error:', err);
    res.status(500).json({ error: 'Failed to create swap request.' });
  }
});

// Get Swap Requests
apiRouter.get('/swap-requests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const all = await db.swapRequests.find();
    const userSwaps = all.filter(
      s => s.requesterId === req.user!.id || s.recipientId === req.user!.id
    );
    res.json({ swaps: userSwaps });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch swap requests.' });
  }
});

// Update Swap Request Status
apiRouter.patch('/swap-requests/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    const swap = await db.swapRequests.findById(req.params.id);
    if (!swap) {
      return res.status(404).json({ error: 'Swap request not found.' });
    }

    const isRecipient = swap.recipientId === req.user!.id;
    const isRequester = swap.requesterId === req.user!.id;

    if (!isRecipient && !isRequester && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a participant in this swap.' });
    }

    const isValid = isValidStatusTransition(
      swap.status,
      status as RequestStatus,
      isRecipient,
      isRequester
    );

    if (!isValid && req.user!.role !== 'admin') {
      return res.status(400).json({ error: 'Invalid state transition for your role.' });
    }

    const updated = await db.swapRequests.updateStatus(req.params.id, status);

    // Reserve or Mark Sold on status changes
    if (status === 'accepted') {
      await db.products.updateStatus(swap.requestedProductId, 'reserved');
      await db.products.updateStatus(swap.offeredProductId, 'reserved');
    } else if (status === 'completed') {
      await db.products.updateStatus(swap.requestedProductId, 'sold');
      await db.products.updateStatus(swap.offeredProductId, 'sold');
    } else if (status === 'rejected' || status === 'cancelled') {
      // Revert if they were reserved
      const reqP = await db.products.findById(swap.requestedProductId);
      if (reqP && reqP.status === 'reserved') {
        await db.products.updateStatus(swap.requestedProductId, 'available');
      }
      const offP = await db.products.findById(swap.offeredProductId);
      if (offP && offP.status === 'reserved') {
        await db.products.updateStatus(swap.offeredProductId, 'available');
      }
    }

    res.json({ message: `Swap request status updated to ${status}.`, swap: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update swap status.' });
  }
});

// ==========================================
// 5. CHAT & MESSAGING ROUTES
// ==========================================

// Get Conversations for Current User
apiRouter.get('/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const convs = await db.conversations.findForUser(req.user!.id);
    res.json({ conversations: convs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations.' });
  }
});

// Start or Open Conversation
apiRouter.post('/conversations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { recipientId, recipientName, productId, productTitle } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required.' });
    }

    if (recipientId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself.' });
    }

    const conv = await db.conversations.findOrCreate(
      [req.user!.id, recipientId],
      {
        [req.user!.id]: req.user!.name,
        [recipientId]: recipientName || 'User',
      },
      productId,
      productTitle
    );

    res.json({ conversation: conv });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create conversation.' });
  }
});

// Get Messages in Conversation
apiRouter.get('/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conv = await db.conversations.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!conv.participantIds.includes(req.user!.id) && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this conversation.' });
    }

    const messages = await db.messages.findByConversationId(req.params.id);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// Send Message
apiRouter.post('/conversations/:id/messages', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    if (content.length > 2000) {
      return res.status(400).json({ error: 'Message exceeds 2000 character limit.' });
    }

    const conv = await db.conversations.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!conv.participantIds.includes(req.user!.id) && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You are not a participant in this conversation.' });
    }

    const message = await db.messages.create(
      conv.id,
      req.user!.id,
      req.user!.name,
      content.trim()
    );

    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ==========================================
// 6. LISTING REPORTS
// ==========================================

apiRouter.post('/reports', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, reason } = req.body;
    if (!productId || !reason || !reason.trim()) {
      return res.status(400).json({ error: 'Product ID and reason are required.' });
    }

    const product = await db.products.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const rep = await db.reports.create({
      productId: product.id,
      productTitle: product.title,
      reporterId: req.user!.id,
      reporterName: req.user!.name,
      reason: reason.trim(),
    });

    res.status(201).json({ success: true, message: 'Report submitted. Our moderation team will review it.', report: rep });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

// ==========================================
// 7. ADMINISTRATOR PANEL ROUTES
// ==========================================

// Admin Stats
apiRouter.get('/admin/stats', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await db.getAdminStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve stats.' });
  }
});

// Admin Users List
apiRouter.get('/admin/users', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.users.find();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// Admin Suspend or Reactivate User
apiRouter.patch('/admin/users/:id/status', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or suspended.' });
    }

    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'You cannot change your own admin account status.' });
    }

    const updated = await db.users.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: `User status changed to ${status}.`, user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

// Admin All Products List
apiRouter.get('/admin/products', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const products = await db.products.find();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// Admin Delete Product
apiRouter.delete('/admin/products/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await db.products.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Listing removed by administrator.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

// Admin Reports List
apiRouter.get('/admin/reports', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await db.reports.find();
    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve reports.' });
  }
});

// Admin Review Report
apiRouter.patch('/admin/reports/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid report status.' });
    }
    const updated = await db.reports.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    res.json({ message: `Report marked as ${status}.`, report: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update report.' });
  }
});

// Health check endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'ArtLoop Marketplace API',
    database: db.isMongoAtlas() ? 'MongoDB Atlas' : 'In-Memory/Local Store',
    timestamp: new Date().toISOString(),
  });
});
