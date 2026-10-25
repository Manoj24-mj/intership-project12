import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canExpressBuyInterest,
  canRequestSwap,
  isValidStatusTransition,
  formatINR,
  filterProducts,
  addRecentSearch,
  removeRecentSearch,
  canModifyProduct,
  canAccessConversation,
  canAccessAdminPanel,
  type ProductItem
} from './rules.ts';

test('canExpressBuyInterest prevents anonymous or seller buy interest', () => {
  const product: Pick<ProductItem, 'sellerId' | 'status'> = {
    sellerId: 'user_1',
    status: 'available'
  };

  // Anonymous
  assert.equal(canExpressBuyInterest(product, null).allowed, false);

  // Own listing
  assert.equal(canExpressBuyInterest(product, 'user_1').allowed, false);

  // Different user, available
  assert.equal(canExpressBuyInterest(product, 'user_2').allowed, true);

  // Sold listing
  const soldProduct: Pick<ProductItem, 'sellerId' | 'status'> = {
    sellerId: 'user_1',
    status: 'sold'
  };
  assert.equal(canExpressBuyInterest(soldProduct, 'user_2').allowed, false);
});

test('canRequestSwap validates item exchange rules strictly', () => {
  const reqProduct: Pick<ProductItem, 'id' | 'sellerId' | 'status'> = {
    id: 'prod_1',
    sellerId: 'user_A',
    status: 'available'
  };

  const myOfferedProduct: Pick<ProductItem, 'id' | 'sellerId' | 'status'> = {
    id: 'prod_2',
    sellerId: 'user_B',
    status: 'available'
  };

  // Valid swap
  const valid = canRequestSwap(reqProduct, myOfferedProduct, 'user_B');
  assert.equal(valid.allowed, true);

  // Cannot request swap on own item
  assert.equal(canRequestSwap(reqProduct, myOfferedProduct, 'user_A').allowed, false);

  // Cannot offer item that is not owned
  assert.equal(canRequestSwap(reqProduct, myOfferedProduct, 'user_C').allowed, false);

  // Cannot swap item with itself
  assert.equal(canRequestSwap(reqProduct, { id: 'prod_1', sellerId: 'user_B', status: 'available' }, 'user_B').allowed, false);

  // Cannot swap if offered item is sold
  assert.equal(canRequestSwap(reqProduct, { ...myOfferedProduct, status: 'sold' }, 'user_B').allowed, false);
});

test('isValidStatusTransition validates state transitions correctly', () => {
  // Pending -> Accepted by recipient/seller: OK
  assert.equal(isValidStatusTransition('pending', 'accepted', true, false), true);

  // Pending -> Accepted by requester: NOT OK
  assert.equal(isValidStatusTransition('pending', 'accepted', false, true), false);

  // Pending -> Cancelled by requester: OK
  assert.equal(isValidStatusTransition('pending', 'cancelled', false, true), true);

  // Accepted -> Completed: OK
  assert.equal(isValidStatusTransition('accepted', 'completed', true, false), true);

  // Terminal state completed -> Accepted: NOT OK
  assert.equal(isValidStatusTransition('completed', 'accepted', true, true), false);
});

test('formatINR formats currency nicely', () => {
  assert.equal(formatINR(250), '₹250');
  assert.equal(formatINR(1200), '₹1,200');
  assert.equal(formatINR(0), '₹0');
});

test('filterProducts filters and sorts properly', () => {
  const sampleProducts: ProductItem[] = [
    {
      id: '1',
      title: 'Acrylic Paint Set',
      description: '12 shades artist grade',
      category: 'Paints and Colours',
      condition: 'New',
      price: 250,
      imageUrl: 'https://example.com/1.jpg',
      location: 'Bengaluru',
      sellerId: 'u1',
      status: 'available',
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: '2',
      title: 'Watercolour Tubes',
      description: 'Used once',
      category: 'Paints and Colours',
      condition: 'Like New',
      price: 180,
      imageUrl: 'https://example.com/2.jpg',
      location: 'Yelahanka',
      sellerId: 'u2',
      status: 'available',
      createdAt: '2026-01-02T00:00:00Z'
    },
    {
      id: '3',
      title: 'A3 Sketchbook',
      description: 'Heavyweight paper',
      category: 'Sketchbooks and Paper',
      condition: 'Good',
      price: 150,
      imageUrl: 'https://example.com/3.jpg',
      location: 'Rajanukunte',
      sellerId: 'u3',
      status: 'available',
      createdAt: '2026-01-03T00:00:00Z'
    }
  ];

  // Search
  const searchResults = filterProducts(sampleProducts, { search: 'sketchbook' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].title, 'A3 Sketchbook');

  // Category & Price
  const paintResults = filterProducts(sampleProducts, {
    category: 'Paints and Colours',
    maxPrice: 200
  });
  assert.equal(paintResults.length, 1);
  assert.equal(paintResults[0].price, 180);

  // Sorting
  const sorted = filterProducts(sampleProducts, { sort: 'price_low' });
  assert.equal(sorted[0].price, 150);
  assert.equal(sorted[2].price, 250);
});

test('addRecentSearch handles deduplication, trimming, and maximum size', () => {
  let history: string[] = [];

  // Add first search
  history = addRecentSearch(history, 'acrylic paint');
  assert.deepEqual(history, ['acrylic paint']);

  // Add another
  history = addRecentSearch(history, 'canvas');
  assert.deepEqual(history, ['canvas', 'acrylic paint']);

  // Add duplicate with different casing
  history = addRecentSearch(history, 'ACRYLIC PAINT');
  assert.deepEqual(history, ['ACRYLIC PAINT', 'canvas']);

  // Ignore empty or whitespace
  history = addRecentSearch(history, '   ');
  assert.deepEqual(history, ['ACRYLIC PAINT', 'canvas']);

  // Max cap test (e.g. limit 3)
  history = addRecentSearch(['a', 'b', 'c'], 'd', 3);
  assert.deepEqual(history, ['d', 'a', 'b']);
});

test('removeRecentSearch removes target query from list', () => {
  const history = ['canvas', 'acrylic', 'sketchbook'];
  const updated = removeRecentSearch(history, 'acrylic');
  assert.deepEqual(updated, ['canvas', 'sketchbook']);
});

test('canModifyProduct enforces seller ownership and admin override', () => {
  const sellerId = 'user_priya';

  // Owner can edit
  assert.equal(canModifyProduct(sellerId, 'user_priya', 'user'), true);

  // Different user cannot edit
  assert.equal(canModifyProduct(sellerId, 'user_rahul', 'user'), false);

  // Anonymous cannot edit
  assert.equal(canModifyProduct(sellerId, null, 'user'), false);

  // Admin can edit or moderate any listing
  assert.equal(canModifyProduct(sellerId, 'user_admin', 'admin'), true);
});

test('canAccessConversation restricts access to conversation participants', () => {
  const participants = ['user_priya', 'user_rahul'];

  // Participants can access
  assert.equal(canAccessConversation(participants, 'user_priya', 'user'), true);
  assert.equal(canAccessConversation(participants, 'user_rahul', 'user'), true);

  // Third party user blocked
  assert.equal(canAccessConversation(participants, 'user_stranger', 'user'), false);

  // Admin can inspect for safety
  assert.equal(canAccessConversation(participants, 'user_admin', 'admin'), true);
});

test('canAccessAdminPanel blocks regular users', () => {
  assert.equal(canAccessAdminPanel('admin'), true);
  assert.equal(canAccessAdminPanel('user'), false);
  assert.equal(canAccessAdminPanel(undefined), false);
});

