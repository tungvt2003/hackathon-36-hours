// Seed dữ liệu mẫu vào Postgres — chạy: npm run prisma:seed (trong apps/api)
// Dùng upsert để chạy lại nhiều lần không bị lỗi duplicate

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env['DATABASE_URL']!),
});

async function main() {
  // ── Users mẫu ──────────────────────────────────────────────
  await prisma.user.upsert({
    where: { id: 'user-001' },
    update: {},
    create: { id: 'user-001', name: 'Nguyễn Văn A', phone: '0901234567' },
  });
  await prisma.user.upsert({
    where: { id: 'user-002' },
    update: {},
    create: { id: 'user-002', name: 'Trần Thị B', phone: '0912345678' },
  });
  console.log('✓ Users');

  // ── Places — địa điểm + quán ăn ──────────────────────────────
  // deleteMany trước để re-seed không bị trùng keywords
  await prisma.place.deleteMany();
  await prisma.place.createMany({
    data: [
      {
        name: 'Sân bay Tân Sơn Nhất',
        address: '60 Trường Sơn, Tân Bình, TP.HCM',
        openHour: 0,
        closeHour: 24,
        keywords: ['tân sơn nhất', 'sân bay', 'tsn', 'airport'],
      },
      {
        name: 'Bến xe Miền Đông',
        address: '292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM',
        openHour: 5,
        closeHour: 22,
        keywords: ['bến xe miền đông', 'miền đông', 'bến xe'],
      },
      {
        name: 'Bến Thành',
        address: 'Phạm Ngũ Lão, Quận 1, TP.HCM',
        openHour: 6,
        closeHour: 22,
        keywords: ['bến thành', 'chợ bến thành'],
      },
      {
        name: 'Landmark 81',
        address: '720A Điện Biên Phủ, Bình Thạnh, TP.HCM',
        openHour: 0,
        closeHour: 24,
        keywords: ['landmark', 'landmark 81', 'vinhomes'],
      },
      {
        name: 'Đại học Bách Khoa TP.HCM',
        address: '268 Lý Thường Kiệt, Quận 10, TP.HCM',
        openHour: 6,
        closeHour: 22,
        keywords: ['bách khoa', 'đại học bách khoa', 'hcmut'],
      },
      // ── Quán ăn ──────────────────────────────────
      {
        name: 'Quán Phở Hà Nội',
        address: '25 Nguyễn Trãi, Quận 1, TP.HCM',
        openHour: 6,
        closeHour: 22,
        keywords: ['phở hà nội', 'phở', 'quán phở'],
      },
      {
        name: 'Cơm Tấm Thuận Kiều',
        address: '12 Lê Thánh Tôn, Quận 1, TP.HCM',
        openHour: 7,
        closeHour: 21,
        keywords: ['thuận kiều', 'cơm tấm', 'cơm tấm thuận kiều'],
      },
      {
        name: 'Bún Bò Huế Bà Mỹ',
        address: '34 Bùi Viện, Quận 1, TP.HCM',
        openHour: 6,
        closeHour: 20,
        keywords: ['bà mỹ', 'bún bò', 'bún bò huế'],
      },
      {
        name: 'Bánh Mì Phượng',
        address: '2B Phan Chu Trinh, Quận 1, TP.HCM',
        openHour: 6,
        closeHour: 21,
        keywords: ['bánh mì phượng', 'bánh mì', 'phượng'],
      },
      {
        name: 'Hủ Tiếu Nam Vang Ngọc Ký',
        address: '126 Võ Văn Tần, Quận 3, TP.HCM',
        openHour: 6,
        closeHour: 14,
        keywords: ['ngọc ký', 'hủ tiếu nam vang', 'hủ tiếu'],
      },
    ],
  });
  console.log('✓ Places');

  // ── PartnerRates — báo giá mô phỏng từng đối tác ─────────────
  await prisma.partnerRate.deleteMany();
  await prisma.partnerRate.createMany({
    data: [
      // Grab
      {
        partner: 'GRAB',
        serviceType: 'GrabCar',
        basePriceVnd: 85000,
        etaMinutes: 3,
        available: true,
        driverName: 'Nguyễn Tài',
      },
      // Be
      {
        partner: 'BE',
        serviceType: 'beCar',
        basePriceVnd: 72000,
        etaMinutes: 4,
        available: true,
        driverName: 'Trần Minh',
      },
      // Xanh SM
      {
        partner: 'XANH_SM',
        serviceType: 'XanhSM Car',
        basePriceVnd: 68000,
        etaMinutes: 5,
        available: true,
        driverName: 'Lê Hùng',
      },
    ],
  });
  console.log('✓ PartnerRates');

  console.log('\nSeed hoàn tất.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
