import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env['DATABASE_URL']!),
});

async function main() {
  console.log('🌱 Seeding per-partner data...');

  // ══════════════════════════════════════════════════════════════
  // GRAB — food + ride
  // ══════════════════════════════════════════════════════════════

  const grabPho = await prisma.grabRestaurant.upsert({
    where: { id: 'grab-rest-pho' },
    update: {},
    create: {
      id: 'grab-rest-pho',
      name: 'Phở Hà Nội',
      address: '25 Nguyễn Trãi, Quận 1, TP.HCM',
      openHour: 6,
      closeHour: 22,
      cuisineType: 'vietnamese',
      rating: 4.7,
      reviewCount: 1240,
      keywords: ['phở hà nội', 'phở', 'pho ha noi', 'quán phở', 'pho', 'pho bo', 'pho ga'],
      deliveryFeeVnd: 15000,
      minOrderVnd: 30000,
    },
  });

  const grabComTam = await prisma.grabRestaurant.upsert({
    where: { id: 'grab-rest-com-tam' },
    update: {},
    create: {
      id: 'grab-rest-com-tam',
      name: 'Cơm Tấm Thuận Kiều',
      address: '12 Lê Thánh Tôn, Quận 1, TP.HCM',
      openHour: 7,
      closeHour: 21,
      cuisineType: 'vietnamese',
      rating: 4.6,
      reviewCount: 890,
      keywords: ['thuận kiều', 'cơm tấm', 'cơm tấm thuận kiều', 'com tam', 'thuan kieu', 'cơm gà', 'com ga'],
      deliveryFeeVnd: 15000,
      minOrderVnd: 30000,
    },
  });

  const grabPlt = await prisma.grabRestaurant.upsert({
    where: { id: 'grab-rest-plt' },
    update: {},
    create: {
      id: 'grab-rest-plt',
      name: 'Cơm Tấm Phúc Lộc Thọ',
      address: '236 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM',
      openHour: 6,
      closeHour: 22,
      cuisineType: 'vietnamese',
      rating: 4.5,
      reviewCount: 520,
      keywords: ['phúc lộc thọ', 'cơm tấm', 'com tam phuc loc tho', 'phuc loc tho', 'suon trung'],
      deliveryFeeVnd: 15000,
      minOrderVnd: 30000,
    },
  });


  const grabKfc = await prisma.grabRestaurant.upsert({
    where: { id: 'grab-rest-kfc' },
    update: {},
    create: {
      id: 'grab-rest-kfc',
      name: 'KFC Bến Thành',
      address: '4 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM',
      openHour: 9,
      closeHour: 22,
      cuisineType: 'fastfood',
      rating: 4.3,
      reviewCount: 560,
      keywords: ['kfc', 'kfc bến thành', 'gà rán kfc', 'kentucky', 'ga ran', 'burger', 'fast food'],
      deliveryFeeVnd: 20000,
      minOrderVnd: 50000,
    },
  });

  await prisma.grabMenuItem.createMany({
    skipDuplicates: true,
    data: [
      // Phở Hà Nội
      { id: 'grab-mi-pho-bo-tai',   grabRestaurantId: grabPho.id, categoryName: 'Phở', name: 'Phở Bò Tái',      description: 'Tái thịt mềm, nước dùng đậm đà', priceVnd: 65000, keywords: ['phở bò tái', 'phở bò', 'pho bo tai', 'bo tai'] },
      { id: 'grab-mi-pho-bo-chin',  grabRestaurantId: grabPho.id, categoryName: 'Phở', name: 'Phở Bò Chín',     description: 'Bò chín mềm', priceVnd: 65000, keywords: ['phở bò chín', 'pho bo chin', 'bo chin'] },
      { id: 'grab-mi-pho-ga',       grabRestaurantId: grabPho.id, categoryName: 'Phở', name: 'Phở Gà',           description: 'Gà ta nước trong', priceVnd: 55000, keywords: ['phở gà', 'pho ga', 'ga'] },
      { id: 'grab-mi-pho-dac-biet', grabRestaurantId: grabPho.id, categoryName: 'Phở', name: 'Phở Đặc Biệt',    description: 'Tái, chín, gân, gàu', priceVnd: 85000, keywords: ['phở đặc biệt', 'dac biet', 'phở tái chín gân'] },
      { id: 'grab-mi-pho-tra-da',   grabRestaurantId: grabPho.id, categoryName: 'Đồ uống', name: 'Trà đá', priceVnd: 10000, keywords: ['trà đá', 'tra da'] },
      { id: 'grab-mi-pho-nuoc-ngot',grabRestaurantId: grabPho.id, categoryName: 'Đồ uống', name: 'Nước ngọt', priceVnd: 15000, keywords: ['nước ngọt', 'pepsi', 'coca cola'] },
      // Cơm Tấm Thuận Kiều
      { id: 'grab-mi-com-suon',     grabRestaurantId: grabComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Tấm Sườn',        description: 'Sườn nướng, bì, chả', priceVnd: 55000, keywords: ['cơm tấm sườn', 'com tam suon', 'suon'] },
      { id: 'grab-mi-com-bi',       grabRestaurantId: grabComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Tấm Bì',          priceVnd: 50000, keywords: ['cơm tấm bì', 'com bi'] },
      { id: 'grab-mi-com-sbc',      grabRestaurantId: grabComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Tấm Sườn Bì Chả', description: 'Combo đầy đủ', priceVnd: 70000, keywords: ['cơm sườn bì chả', 'sbc', 'com dac biet', 'sườn bì chả'] },
      { id: 'grab-mi-com-cha',      grabRestaurantId: grabComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Tấm Chả',         priceVnd: 50000, keywords: ['cơm tấm chả', 'cha'] },
      { id: 'grab-mi-com-ga',       grabRestaurantId: grabComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Gà',               priceVnd: 55000, keywords: ['cơm gà', 'com ga', 'ga'] },
      { id: 'grab-mi-com-tra-da',   grabRestaurantId: grabComTam.id, categoryName: 'Đồ uống', name: 'Trà đá', priceVnd: 10000, keywords: ['trà đá'] },
      // KFC
      { id: 'grab-mi-kfc-ga1',      grabRestaurantId: grabKfc.id, categoryName: 'Gà Rán', name: 'Gà Rán Original 1 miếng', priceVnd: 45000, keywords: ['gà rán', 'ga ran', 'kfc', '1 miếng'] },
      { id: 'grab-mi-kfc-ga2',      grabRestaurantId: grabKfc.id, categoryName: 'Gà Rán', name: 'Gà Rán 2 miếng',          priceVnd: 85000, keywords: ['gà rán 2', '2 miếng', 'ga ran 2'] },
      { id: 'grab-mi-kfc-burger',   grabRestaurantId: grabKfc.id, categoryName: 'Burger', name: 'Burger Gà Giòn',           priceVnd: 55000, keywords: ['burger gà', 'burger', 'ga gion'] },
      { id: 'grab-mi-kfc-khoai',    grabRestaurantId: grabKfc.id, categoryName: 'Phụ', name: 'Khoai Tây Chiên',             priceVnd: 35000, keywords: ['khoai tây', 'fries'] },
      { id: 'grab-mi-kfc-pepsi',    grabRestaurantId: grabKfc.id, categoryName: 'Đồ uống', name: 'Pepsi', priceVnd: 20000, keywords: ['pepsi', 'cola'] },
      // Cơm Tấm Phúc Lộc Thọ
      { id: 'grab-mi-com-suon-trung', grabRestaurantId: 'grab-rest-plt', categoryName: 'Cơm Tấm', name: 'Cơm Tấm Sườn Trứng', priceVnd: 45000, keywords: ['cơm sườn trứng', 'cơm tấm sườn trứng', 'suon trung', 'sườn trứng'] },
    ],
  });


  await prisma.grabPromotion.createMany({
    skipDuplicates: true,
    data: [
      { id: 'grab-promo-pct20', grabRestaurantId: null, discountType: 'PERCENT', discountValue: 20, minOrderVnd: 50000, maxDiscountVnd: 30000, active: true },
      { id: 'grab-promo-free-ship', grabRestaurantId: null, discountType: 'FREE_DELIVERY', discountValue: 0, minOrderVnd: 80000, active: true },
    ],
  });

  await prisma.grabRideOption.createMany({
    skipDuplicates: true,
    data: [
      { id: 'grab-ride-car',  serviceType: 'GrabCar',  basePriceVnd: 85000, etaMinutes: 5, available: true },
      { id: 'grab-ride-bike', serviceType: 'GrabBike', basePriceVnd: 35000, etaMinutes: 4, available: true },
    ],
  });

  await prisma.grabDriver.createMany({
    skipDuplicates: true,
    data: [
      { id: 'grab-drv-1', name: 'Nguyễn Tài',     phone: '0901111001', vehicleType: 'GrabCar',  vehiclePlate: '51A-12345', rating: 4.8, currentLat: 10.7760, currentLng: 106.7010 },
      { id: 'grab-drv-2', name: 'Trần Văn Hùng',  phone: '0901111002', vehicleType: 'GrabCar',  vehiclePlate: '51A-23456', rating: 4.9, currentLat: 10.7740, currentLng: 106.6980 },
      { id: 'grab-drv-3', name: 'Lê Quốc Bảo',    phone: '0901111003', vehicleType: 'GrabBike', vehiclePlate: '59A-34567', rating: 4.7, currentLat: 10.7770, currentLng: 106.7030 },
      { id: 'grab-drv-4', name: 'Phạm Minh Tuấn', phone: '0901111004', vehicleType: 'GrabBike', vehiclePlate: '59A-45678', rating: 4.6, currentLat: 10.7730, currentLng: 106.6990 },
      { id: 'grab-drv-5', name: 'Võ Thanh Long',  phone: '0901111005', vehicleType: 'GrabCar',  vehiclePlate: '51A-56789', rating: 4.8, currentLat: 10.7780, currentLng: 106.7020 },
    ],
  });

  console.log('✓ Grab data seeded');

  // ══════════════════════════════════════════════════════════════
  // BE — food + ride (khác giá, khác quán)
  // ══════════════════════════════════════════════════════════════

  const beBunBo = await prisma.beRestaurant.upsert({
    where: { id: 'be-rest-bun-bo' },
    update: {},
    create: {
      id: 'be-rest-bun-bo',
      name: 'Bún Bò Huế Bà Mỹ',
      address: '34 Bùi Viện, Quận 1, TP.HCM',
      openHour: 6,
      closeHour: 20,
      cuisineType: 'vietnamese',
      rating: 4.8,
      reviewCount: 720,
      keywords: ['bà mỹ', 'bún bò', 'bún bò huế', 'bun bo hue', 'ba my', 'bun bo'],
      deliveryFeeVnd: 10000,
      minOrderVnd: 20000,
    },
  });

  const beComTam = await prisma.beRestaurant.upsert({
    where: { id: 'be-rest-com-tam' },
    update: {},
    create: {
      id: 'be-rest-com-tam',
      name: 'Cơm Tấm Thuận Kiều',
      address: '12 Lê Thánh Tôn, Quận 1, TP.HCM',
      openHour: 7,
      closeHour: 21,
      cuisineType: 'vietnamese',
      rating: 4.5,
      reviewCount: 410,
      keywords: ['thuận kiều', 'cơm tấm', 'com tam', 'thuan kieu', 'cơm gà', 'com ga'],
      deliveryFeeVnd: 10000,
      minOrderVnd: 20000,
    },
  });

  await prisma.beMenuItem.createMany({
    skipDuplicates: true,
    data: [
      // Bún Bò Huế Bà Mỹ — Be có giá rẻ hơn ~5k
      { id: 'be-mi-bun-bo',        beRestaurantId: beBunBo.id, categoryName: 'Bún Bò', name: 'Bún Bò Huế',       description: 'Cay đặc trưng, thịt bò mềm', priceVnd: 58000, keywords: ['bún bò', 'bún bò huế', 'bun bo hue', 'bun bo'] },
      { id: 'be-mi-bun-bo-db',     beRestaurantId: beBunBo.id, categoryName: 'Bún Bò', name: 'Bún Bò Đặc Biệt',  description: 'Giò heo, huyết, chả', priceVnd: 72000, keywords: ['bún bò đặc biệt', 'bun bo dac biet'] },
      { id: 'be-mi-bun-gio-heo',   beRestaurantId: beBunBo.id, categoryName: 'Bún Bò', name: 'Bún Giò Heo',      priceVnd: 62000, keywords: ['bún giò', 'gio heo'] },
      { id: 'be-mi-bun-bo-chay',   beRestaurantId: beBunBo.id, categoryName: 'Bún Bò', name: 'Bún Bò Chay',      priceVnd: 52000, keywords: ['bún chay', 'chay'] },
      { id: 'be-mi-bun-tra-da',    beRestaurantId: beBunBo.id, categoryName: 'Đồ uống', name: 'Trà đá', priceVnd: 8000, keywords: ['trà đá'] },
      // Cơm Tấm — Be (ít món hơn Grab)
      { id: 'be-mi-com-suon',      beRestaurantId: beComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Tấm Sườn',  priceVnd: 53000, keywords: ['cơm tấm sườn', 'com tam suon', 'suon'] },
      { id: 'be-mi-com-sbc',       beRestaurantId: beComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Tấm Sườn Bì Chả', priceVnd: 68000, keywords: ['sườn bì chả', 'com dac biet', 'sbc'] },
      { id: 'be-mi-com-ga',        beRestaurantId: beComTam.id, categoryName: 'Cơm Tấm', name: 'Cơm Gà',         priceVnd: 53000, keywords: ['cơm gà', 'com ga', 'ga'] },
      { id: 'be-mi-com-tra-da',    beRestaurantId: beComTam.id, categoryName: 'Đồ uống', name: 'Trà đá', priceVnd: 8000, keywords: ['trà đá'] },
    ],
  });

  await prisma.bePromotion.createMany({
    skipDuplicates: true,
    data: [
      { id: 'be-promo-free-ship', beRestaurantId: null, discountType: 'FREE_DELIVERY', discountValue: 0, minOrderVnd: 50000, active: true },
      { id: 'be-promo-fixed10k',  beRestaurantId: null, discountType: 'FIXED', discountValue: 10000, minOrderVnd: 30000, active: true },
    ],
  });

  await prisma.beRideOption.createMany({
    skipDuplicates: true,
    data: [
      { id: 'be-ride-car',  serviceType: 'beCar',  basePriceVnd: 72000, etaMinutes: 6, available: true },
      { id: 'be-ride-bike', serviceType: 'beBike', basePriceVnd: 30000, etaMinutes: 4, available: true },
    ],
  });

  await prisma.beDriver.createMany({
    skipDuplicates: true,
    data: [
      { id: 'be-drv-1', name: 'Trần Minh',        phone: '0902222001', vehicleType: 'beCar',  vehiclePlate: '51B-67890', rating: 4.9, currentLat: 10.7750, currentLng: 106.7000 },
      { id: 'be-drv-2', name: 'Nguyễn Quang',     phone: '0902222002', vehicleType: 'beBike', vehiclePlate: '59B-78901', rating: 4.7, currentLat: 10.7760, currentLng: 106.6970 },
      { id: 'be-drv-3', name: 'Đinh Công Thành',  phone: '0902222003', vehicleType: 'beCar',  vehiclePlate: '51B-89012', rating: 4.8, currentLat: 10.7740, currentLng: 106.7010 },
      { id: 'be-drv-4', name: 'Hoàng Văn Đức',    phone: '0902222004', vehicleType: 'beBike', vehiclePlate: '59B-90123', rating: 4.6, currentLat: 10.7770, currentLng: 106.6980 },
    ],
  });

  console.log('✓ Be data seeded');

  // ══════════════════════════════════════════════════════════════
  // XANH SM — ride only, VinFast
  // ══════════════════════════════════════════════════════════════

  await prisma.xanhSmRideOption.createMany({
    skipDuplicates: true,
    data: [
      { id: 'xsm-ride-car', serviceType: 'XanhSM Car', basePriceVnd: 68000, etaMinutes: 7, available: true },
    ],
  });

  await prisma.xanhSmDriver.createMany({
    skipDuplicates: true,
    data: [
      { id: 'xsm-drv-1', name: 'Lê Hùng',       phone: '0903333001', vehicleType: 'XanhSM Car', vehiclePlate: '51C-11223', rating: 4.7, currentLat: 10.7750, currentLng: 106.7020 },
      { id: 'xsm-drv-2', name: 'Bùi Thế Anh',   phone: '0903333002', vehicleType: 'XanhSM Car', vehiclePlate: '51C-22334', rating: 4.9, currentLat: 10.7730, currentLng: 106.7000 },
      { id: 'xsm-drv-3', name: 'Ngô Văn Khôi',  phone: '0903333003', vehicleType: 'XanhSM Car', vehiclePlate: '51C-33445', rating: 4.8, currentLat: 10.7780, currentLng: 106.6990 },
    ],
  });

  console.log('✓ Xanh SM data seeded');

  // ══════════════════════════════════════════════════════════════
  // SHOPEE — food only, có cả 3 quán nhưng giá khác
  // ══════════════════════════════════════════════════════════════

  const shopeePho = await prisma.shopeeRestaurant.upsert({
    where: { id: 'shopee-rest-pho' },
    update: {},
    create: {
      id: 'shopee-rest-pho',
      name: 'Phở Hà Nội',
      address: '25 Nguyễn Trãi, Quận 1, TP.HCM',
      openHour: 6,
      closeHour: 22,
      cuisineType: 'vietnamese',
      rating: 4.6,
      reviewCount: 830,
      keywords: ['phở hà nội', 'phở', 'pho ha noi', 'pho', 'pho bo', 'pho ga'],
      deliveryFeeVnd: 12000,
      minOrderVnd: 25000,
    },
  });

  const shopeeBunBo = await prisma.shopeeRestaurant.upsert({
    where: { id: 'shopee-rest-bun-bo' },
    update: {},
    create: {
      id: 'shopee-rest-bun-bo',
      name: 'Bún Bò Huế Bà Mỹ',
      address: '34 Bùi Viện, Quận 1, TP.HCM',
      openHour: 6,
      closeHour: 20,
      cuisineType: 'vietnamese',
      rating: 4.9,
      reviewCount: 1100,
      keywords: ['bà mỹ', 'bún bò', 'bún bò huế', 'bun bo hue', 'ba my', 'bun bo'],
      deliveryFeeVnd: 12000,
      minOrderVnd: 25000,
    },
  });

  const shopeeKfc = await prisma.shopeeRestaurant.upsert({
    where: { id: 'shopee-rest-kfc' },
    update: {},
    create: {
      id: 'shopee-rest-kfc',
      name: 'KFC Bến Thành',
      address: '4 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM',
      openHour: 9,
      closeHour: 22,
      cuisineType: 'fastfood',
      rating: 4.2,
      reviewCount: 390,
      keywords: ['kfc', 'gà rán kfc', 'ga ran', 'burger', 'fast food'],
      deliveryFeeVnd: 18000,
      minOrderVnd: 50000,
    },
  });

  await prisma.shopeeMenuItem.createMany({
    skipDuplicates: true,
    data: [
      // Phở Hà Nội — Shopee giá hơn Grab 3k
      { id: 'shopee-mi-pho-bo-tai',   shopeeRestaurantId: shopeePho.id, categoryName: 'Phở', name: 'Phở Bò Tái',      priceVnd: 68000, keywords: ['phở bò tái', 'pho bo tai', 'bo tai'] },
      { id: 'shopee-mi-pho-bo-chin',  shopeeRestaurantId: shopeePho.id, categoryName: 'Phở', name: 'Phở Bò Chín',     priceVnd: 68000, keywords: ['phở bò chín', 'bo chin'] },
      { id: 'shopee-mi-pho-ga',       shopeeRestaurantId: shopeePho.id, categoryName: 'Phở', name: 'Phở Gà',           priceVnd: 57000, keywords: ['phở gà', 'pho ga', 'ga'] },
      { id: 'shopee-mi-pho-dac-biet', shopeeRestaurantId: shopeePho.id, categoryName: 'Phở', name: 'Phở Đặc Biệt',    priceVnd: 88000, keywords: ['phở đặc biệt', 'dac biet'] },
      { id: 'shopee-mi-pho-tra-da',   shopeeRestaurantId: shopeePho.id, categoryName: 'Đồ uống', name: 'Trà đá', priceVnd: 10000, keywords: ['trà đá'] },
      // Bún Bò — Shopee
      { id: 'shopee-mi-bun-bo',       shopeeRestaurantId: shopeeBunBo.id, categoryName: 'Bún Bò', name: 'Bún Bò Huế',      priceVnd: 62000, keywords: ['bún bò', 'bún bò huế', 'bun bo'] },
      { id: 'shopee-mi-bun-bo-db',    shopeeRestaurantId: shopeeBunBo.id, categoryName: 'Bún Bò', name: 'Bún Bò Đặc Biệt', priceVnd: 78000, keywords: ['bún bò đặc biệt', 'bun bo dac biet'] },
      { id: 'shopee-mi-bun-gio-heo',  shopeeRestaurantId: shopeeBunBo.id, categoryName: 'Bún Bò', name: 'Bún Giò Heo',     priceVnd: 68000, keywords: ['bún giò', 'gio heo'] },
      { id: 'shopee-mi-bun-tra-da',   shopeeRestaurantId: shopeeBunBo.id, categoryName: 'Đồ uống', name: 'Trà đá', priceVnd: 10000, keywords: ['trà đá'] },
      // KFC — Shopee
      { id: 'shopee-mi-kfc-ga1',      shopeeRestaurantId: shopeeKfc.id, categoryName: 'Gà Rán', name: 'Gà Rán Original 1 miếng', priceVnd: 47000, keywords: ['gà rán', 'ga ran', 'kfc'] },
      { id: 'shopee-mi-kfc-ga2',      shopeeRestaurantId: shopeeKfc.id, categoryName: 'Gà Rán', name: 'Gà Rán 2 miếng',          priceVnd: 88000, keywords: ['gà rán 2', '2 miếng'] },
      { id: 'shopee-mi-kfc-burger',   shopeeRestaurantId: shopeeKfc.id, categoryName: 'Burger', name: 'Burger Gà Giòn',           priceVnd: 57000, keywords: ['burger gà', 'burger'] },
      { id: 'shopee-mi-kfc-khoai',    shopeeRestaurantId: shopeeKfc.id, categoryName: 'Phụ', name: 'Khoai Tây Chiên',             priceVnd: 37000, keywords: ['khoai tây', 'fries'] },
    ],
  });

  await prisma.shopeePromotion.createMany({
    skipDuplicates: true,
    data: [
      { id: 'shopee-promo-fixed15k',    shopeeRestaurantId: null,         discountType: 'FIXED',   discountValue: 15000, minOrderVnd: 40000, active: true },
      { id: 'shopee-promo-pho-pct15',   shopeeRestaurantId: shopeePho.id, discountType: 'PERCENT', discountValue: 15,    minOrderVnd: 60000, maxDiscountVnd: 20000, active: true },
    ],
  });

  await prisma.shopeeDriver.createMany({
    skipDuplicates: true,
    data: [
      { id: 'shopee-drv-1', name: 'Phan Văn Nam',    phone: '0904444001', vehicleType: 'Shopee Bike', vehiclePlate: '59S-44556', rating: 4.6, currentLat: 10.7760, currentLng: 106.7000 },
      { id: 'shopee-drv-2', name: 'Đỗ Quang Hải',    phone: '0904444002', vehicleType: 'Shopee Bike', vehiclePlate: '59S-55667', rating: 4.7, currentLat: 10.7740, currentLng: 106.7030 },
      { id: 'shopee-drv-3', name: 'Lý Văn Phúc',     phone: '0904444003', vehicleType: 'Shopee Bike', vehiclePlate: '59S-66778', rating: 4.8, currentLat: 10.7770, currentLng: 106.7010 },
      { id: 'shopee-drv-4', name: 'Trương Minh Đức', phone: '0904444004', vehicleType: 'Shopee Bike', vehiclePlate: '59S-77889', rating: 4.5, currentLat: 10.7750, currentLng: 106.6980 },
    ],
  });

  console.log('✓ Shopee data seeded');

  // ══════════════════════════════════════════════════════════════
  // Places — cho PlacesProvider
  // ══════════════════════════════════════════════════════════════

  await prisma.place.createMany({
    skipDuplicates: true,
    data: [
      { id: 'place-tsn',       name: 'Sân bay Tân Sơn Nhất',  address: '60 Trường Sơn, Tân Bình, TP.HCM',         openHour: 0,  closeHour: 24, keywords: ['tân sơn nhất', 'sân bay', 'tsn', 'airport', 'tan son nhat'], rainOverride: true },
      { id: 'place-ben-xe-md', name: 'Bến xe Miền Đông',       address: '292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM',   openHour: 5,  closeHour: 22, keywords: ['bến xe miền đông', 'miền đông', 'ben xe'], rainOverride: false },
      { id: 'place-ben-thanh', name: 'Chợ Bến Thành',          address: 'Quảng trường Quách Thị Trang, Q1',       openHour: 6,  closeHour: 19, keywords: ['bến thành', 'chợ bến thành', 'ben thanh'], rainOverride: false },
      { id: 'place-bitexco',   name: 'Bitexco Financial Tower', address: '2 Hải Triều, Q1, TP.HCM',               openHour: 8,  closeHour: 22, keywords: ['bitexco', 'tháp bitexco'], rainOverride: true },
      { id: 'place-quan-1',    name: 'Quận 1',                  address: 'Quận 1, TP.HCM',                        openHour: 0,  closeHour: 24, keywords: ['quận 1', 'q1', 'quan 1'], rainOverride: false },
    ],
  });


  console.log('✓ Places seeded');
  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
