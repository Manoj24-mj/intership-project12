export interface SeedProduct {
  id: string;
  title: string;
  description: string;
  category:
    | 'Paints and Colours'
    | 'Brushes and Painting Tools'
    | 'Canvas and Surfaces'
    | 'Sketchbooks and Paper'
    | 'Drawing and Sketching Tools'
    | 'Craft Supplies'
    | 'Other Art Materials';
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  price: number;
  imageUrl: string;
  location: string;
  sellerId: string;
  sellerName: string;
  status: 'available' | 'reserved' | 'sold';
}

export const SEED_USERS = [
  {
    id: 'user_priya',
    name: 'Priya Sharma',
    email: 'priya@artloop.in',
    passwordRaw: 'artloop123',
    location: 'Yelahanka, Bengaluru',
    role: 'user' as const,
    accountStatus: 'active' as const,
  },
  {
    id: 'user_rahul',
    name: 'Rahul Verma',
    email: 'rahul@artloop.in',
    passwordRaw: 'artloop123',
    location: 'Rajanukunte, Bengaluru',
    role: 'user' as const,
    accountStatus: 'active' as const,
  },
  {
    id: 'user_admin',
    name: 'ArtLoop Administrator',
    email: 'admin@artloop.in',
    passwordRaw: 'admin123',
    location: 'Bengaluru Central',
    role: 'admin' as const,
    accountStatus: 'active' as const,
  },
];

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'prod_1',
    title: 'Acrylic Paint Set, 12 Colours',
    description: 'Camel artist acrylic 12-tube set (20ml each). Used only titanium white and crimson once; all other 10 tubes are sealed and fresh. Perfect for canvas paintings and student projects.',
    category: 'Paints and Colours',
    condition: 'Like New',
    price: 250,
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    location: 'Yelahanka, Bengaluru',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    status: 'available',
  },
  {
    id: 'prod_2',
    title: 'Watercolour Paint Set (18 Pans)',
    description: 'Compact student pocket watercolour tin with built-in mixing palette. 18 half-pans with high pigment concentration. Clean condition with slight surface wear.',
    category: 'Paints and Colours',
    condition: 'Good',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    location: 'Rajanukunte, Bengaluru',
    sellerId: 'user_rahul',
    sellerName: 'Rahul Verma',
    status: 'available',
  },
  {
    id: 'prod_3',
    title: 'Brush Collection, 8 Pieces',
    description: 'Set of 8 synthetic bristle round and flat brushes (sizes 0, 2, 4, 6, 8, 10, 12 and fan brush). Well-maintained with bristle protectors, suitable for acrylic and oil.',
    category: 'Brushes and Painting Tools',
    condition: 'Like New',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    location: 'Yelahanka, Bengaluru',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    status: 'available',
  },
  {
    id: 'prod_4',
    title: 'A3 Spiral Sketchbook (140 GSM)',
    description: 'Acid-free cartridge paper sketchbook, 45 unused sheets remaining out of 50. Micro-perforated edges and sturdy cardboard backing for field sketching.',
    category: 'Sketchbooks and Paper',
    condition: 'Like New',
    price: 150,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    location: 'Rajanukunte, Bengaluru',
    sellerId: 'user_rahul',
    sellerName: 'Rahul Verma',
    status: 'available',
  },
  {
    id: 'prod_5',
    title: 'Small Canvas Pack (3 Pieces, 8x10 inch)',
    description: 'Triple-primed 100% cotton stretched canvas boards. Wrapped in plastic film, brand new and ready to paint. Selling surplus from final semester submission.',
    category: 'Canvas and Surfaces',
    condition: 'New',
    price: 300,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    location: 'Yelahanka, Bengaluru',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    status: 'available',
  },
  {
    id: 'prod_6',
    title: 'Graphite Pencil Set (12 Gradations)',
    description: 'Graded sketching pencils from 2H to 8B in embossed metal tin. Includes kneaded eraser and dual-hole sharpener. Lightly sharpened 2B pencil, others untouched.',
    category: 'Drawing and Sketching Tools',
    condition: 'Like New',
    price: 100,
    imageUrl: 'https://images.unsplash.com/photo-1585336261024-64ed7d013cd1?auto=format&fit=crop&w=800&q=80',
    location: 'Bengaluru Central',
    sellerId: 'user_rahul',
    sellerName: 'Rahul Verma',
    status: 'available',
  },
  {
    id: 'prod_7',
    title: 'Colour Pencil Set (24 Soft Shades)',
    description: 'Rich wax-based artist coloured pencils with vibrant blending properties. Kept in cloth roll case. Ideal for botanical illustration and urban sketching.',
    category: 'Drawing and Sketching Tools',
    condition: 'Good',
    price: 220,
    imageUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    location: 'Yelahanka, Bengaluru',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    status: 'available',
  },
  {
    id: 'prod_8',
    title: 'Beginner Calligraphy Kit with Nibs',
    description: 'Wooden dip pen holder with 5 interchangeable steel calligraphy nibs, 30ml waterproof black Indian ink bottle, and sample guideline practice sheets.',
    category: 'Other Art Materials',
    condition: 'New',
    price: 280,
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    location: 'Malleshwaram, Bengaluru',
    sellerId: 'user_rahul',
    sellerName: 'Rahul Verma',
    status: 'available',
  },
  {
    id: 'prod_9',
    title: 'Poster Colours (Pack of 12 Jars)',
    description: 'Opaque water-soluble poster paints with rich coverage. Glass jars are tightly capped and none are dried. Great for graphic design and poster assignments.',
    category: 'Paints and Colours',
    condition: 'Good',
    price: 140,
    imageUrl: 'https://images.unsplash.com/photo-1560421683-680b93811a0b?auto=format&fit=crop&w=800&q=80',
    location: 'Rajanukunte, Bengaluru',
    sellerId: 'user_rahul',
    sellerName: 'Rahul Verma',
    status: 'available',
  },
  {
    id: 'prod_10',
    title: 'Drawing Charcoal Set (Willow & Compressed)',
    description: 'Natural willow charcoal sticks (thin, medium, thick) plus 3 compressed charcoal pencils and blending stumps. Excellent for expressive life-drawing sessions.',
    category: 'Drawing and Sketching Tools',
    condition: 'Like New',
    price: 160,
    imageUrl: 'https://images.unsplash.com/photo-1572945753563-804956783134?auto=format&fit=crop&w=800&q=80',
    location: 'Indiranagar, Bengaluru',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    status: 'available',
  },
  {
    id: 'prod_11',
    title: 'Craft Paper Collection (Assorted Textures)',
    description: 'Pack of 35 sheets of handmade textured paper, kraft paper, and handmade deckle-edge sheets (180-250 GSM). Wonderful for collage and mixed media.',
    category: 'Craft Supplies',
    condition: 'New',
    price: 90,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
    location: 'Yelahanka, Bengaluru',
    sellerId: 'user_priya',
    sellerName: 'Priya Sharma',
    status: 'available',
  },
  {
    id: 'prod_12',
    title: 'Painting Palette and Stainless Steel Tools',
    description: 'Kidney-shaped wooden thumb-hole artist palette plus two stainless steel palette knives and double dipper brush washer cup. Durable and easy to clean.',
    category: 'Brushes and Painting Tools',
    condition: 'Good',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=800&q=80',
    location: 'Koramangala, Bengaluru',
    sellerId: 'user_rahul',
    sellerName: 'Rahul Verma',
    status: 'available',
  },
];
