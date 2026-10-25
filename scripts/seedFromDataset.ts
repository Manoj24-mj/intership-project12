import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { initDatabase, UserModel, ProductModel } from '../server/db.ts';

dotenv.config();

// Subject-to-Photo mapping with high quality curated artworks from Unsplash
const SUBJECT_IMAGES: Record<string, string[]> = {
  Seascape: [
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=80',
  ],
  Abstract: [
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1551972251-12070d63502a?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80',
  ],
  'Still Life': [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80',
  ],
  Wildlife: [
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1508672019048-805b876b67e2?auto=format&fit=crop&w=900&q=80',
  ],
  Landscape: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80',
  ],
  Fantasy: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=900&q=80',
  ],
  Portrait: [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  ],
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export async function importDataset(limit = 120) {
  console.log('Connecting to database...');
  await initDatabase();
  const User = UserModel;
  const Product = ProductModel;

  if (!User || !Product) {
    console.error('Database models not initialized. Check MongoDB connection.');
    return;
  }

  const csvPath = path.resolve(process.cwd(), 'public/assets/aistudio/large_art_ecommerce_dataset_45376023.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`Dataset not found at ${csvPath}`);
    return;
  }

  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.trim().split('\n');
  const header = parseCSVLine(lines[0]);
  console.log(`Found ${lines.length - 1} records in CSV dataset.`);

  // Artists cache
  const defaultPasswordHash = await bcrypt.hash('artloop123', 10);
  const artistMap: Record<string, { id: string; name: string; location: string }> = {};

  // First pass: identify unique painters and create accounts
  for (let i = 1; i < lines.length && i <= limit * 2; i++) {
    const cols = parseCSVLine(lines[i]);
    const painter = cols[0];
    const loc = cols[6] || 'Bengaluru';
    if (!painter || artistMap[painter]) continue;

    const email = `${painter.toLowerCase().replace(/[^a-z0-9]/g, '')}@artloop.in`;
    const userId = `user_${painter.toLowerCase()}`;

    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({
        id: userId,
        name: `${painter} (Artist)`,
        email,
        passwordHash: defaultPasswordHash,
        location: loc,
        role: 'user',
        accountStatus: 'active',
      });
      console.log(`Created artist account for ${painter} (${email})`);
    }

    artistMap[painter] = {
      id: userId,
      name: `${painter} (Artist)`,
      location: loc,
    };
  }

  // Second pass: insert products
  let importedCount = 0;
  for (let i = 1; i < lines.length && importedCount < limit; i++) {
    const cols = parseCSVLine(lines[i]);
    const [
      painter,
      subject,
      style,
      medium,
      size,
      frame,
      location,
      priceStr,
      deliveryDays,
      shipment,
      colorPalette,
      copyOrOriginal,
      printOrReal,
      environment,
      mood,
      lighting,
      reproType,
      targetAudience,
    ] = cols;

    if (!painter || !subject) continue;

    const productId = `art_ds_${i}`;
    const existingProduct = await Product.findOne({ id: productId });
    if (existingProduct) {
      continue;
    }

    const price = Number(priceStr) || 350;
    const isOriginal = copyOrOriginal === 'Original' && printOrReal === 'Real';
    const condition = isOriginal ? 'New' : copyOrOriginal === 'Original' ? 'Like New' : 'Good';
    const category = printOrReal === 'Print' ? 'Fine Art & Prints' : 'Original Paintings & Artworks';

    // Pick image from subject mapping
    const imgList = SUBJECT_IMAGES[subject] || SUBJECT_IMAGES['Abstract'];
    const imageUrl = imgList[i % imgList.length];

    const title = `${subject} in ${style} (${size.replace(/""/g, '"')})`;
    const description = `Authentic ${copyOrOriginal.toLowerCase()} artwork in ${style.toLowerCase()} style created with ${medium.toLowerCase()} on stretched surface (${size.replace(/""/g, '"')}). Featuring ${colorPalette.toLowerCase()} evoking a ${mood.toLowerCase()} atmosphere. Framing: ${frame === 'Yes' ? 'Framed and ready to hang' : 'Unframed canvas'}. Perfect for ${environment.toLowerCase()} space under ${lighting.toLowerCase()}. Artist: ${painter}.`;

    const seller = artistMap[painter] || {
      id: `user_${painter.toLowerCase()}`,
      name: `${painter} (Artist)`,
      location: location || 'Bengaluru',
    };

    await Product.create({
      id: productId,
      title,
      description,
      category,
      condition,
      price,
      imageUrl,
      location: location || seller.location,
      sellerId: seller.id,
      sellerName: seller.name,
      status: 'available',
    });

    importedCount++;
  }

  console.log(`Successfully imported ${importedCount} artworks from dataset into database!`);
}

// Run standalone if invoked directly
if (process.argv[1]?.endsWith('seedFromDataset.ts')) {
  importDataset(150)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Import failed:', err);
      process.exit(1);
    });
}
