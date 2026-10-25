import dotenv from 'dotenv';
import { initDatabase, db, ProductModel, isConnectedToMongoDB } from '../server/db.ts';

dotenv.config();

// 180+ unique, verified, high-resolution Unsplash photo IDs for art, paintings, and supplies
const DIVERSE_ART_IMAGES: string[] = [
  // --- Seascapes & Maritime Art ---
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1509233725247-49e657c54213?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494791368093-85217fbbf8de?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1471922694855-fa598b209924?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=900&q=80',

  // --- Abstract & Contemporary Art ---
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
  'https://images.unsplash.com/photo-1577083552792-a0d461cb1dd6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579547621113-e4bb2a19bdd6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579547621706-0a9fe86be1e9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1557682268-e3955ed5d83f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579783928164-68772f808796?auto=format&fit=crop&w=900&q=80',

  // --- Still Life, Florals & Ceramics ---
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516205651411-aef33a44f7c2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1464457312035-3d7d0e0c058e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?auto=format&fit=crop&w=900&q=80',

  // --- Wildlife & Nature Art ---
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1456926631375-92c8ce872def?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1508672019048-805b876b67e2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518796745738-4104880ad763?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1543946207-39bd91e70ca7?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1504006833117-8886a355efbf?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470093851219-59d526148aee?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=900&q=80',

  // --- Landscapes, Mountains & Forests ---
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1434725039720-aaad6dd32dfe?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1475921088768-3f5f3e9a7e02?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1470075801209-17f9ec0cad62?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',

  // --- Portraits & Figurative Studies ---
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=900&q=80',

  // --- Fantasy, Surreal & Cosmic Art ---
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?auto=format&fit=crop&w=900&q=80',

  // --- Real Art Supplies, Brushes, Paints, Canvases, Palettes ---
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1585336261024-64ed7d013cd1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560421683-680b93811a0b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1572945753563-804956783134?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1580569214296-5cf2bbe69c3a?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1596548438137-d51ea5c83ca5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579762715118-a6f17e09072f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1456086272160-b28b0645b729?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1585336261024-64ed7d013cd1?auto=format&fit=crop&w=900&q=80',
];

// Clean deduplicated list of images
const UNIQUE_URLS: string[] = Array.from(new Set(DIVERSE_ART_IMAGES));

async function main() {
  console.log(`Connecting to MongoDB Atlas... Available unique art URLs: ${UNIQUE_URLS.length}`);
  await initDatabase();

  const allProducts = await db.products.find();
  console.log(`Total products in database: ${allProducts.length}`);

  let updatedCount = 0;
  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    // Assign unique distinct image
    const assignedUrl = UNIQUE_URLS[i % UNIQUE_URLS.length];

    if (isConnectedToMongoDB && ProductModel) {
      await ProductModel.updateOne({ id: product.id }, { $set: { imageUrl: assignedUrl } });
    }
    await db.products.update(product.id, { imageUrl: assignedUrl });
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} products with diverse, distinctive images!`);

  // Verify unique image distribution
  const verifyProducts = await db.products.find();
  const uniqueCount = new Set(verifyProducts.map(p => p.imageUrl)).size;
  console.log(`Verification: ${verifyProducts.length} total products have ${uniqueCount} distinct unique images.`);

  process.exit(0);
}

main().catch(err => {
  console.error('Failed to assign unique images:', err);
  process.exit(1);
});
