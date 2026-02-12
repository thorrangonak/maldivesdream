import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5434/maldives_dream?schema=public";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌴 Seeding Maldives Dream database...\n");

  // ── Admin Users ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@maldivesdream.com" },
    update: {},
    create: {
      email: "admin@maldivesdream.com",
      passwordHash,
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✓ Admin user: ${admin.email} (password: admin123456)`);

  const staff = await prisma.user.upsert({
    where: { email: "staff@maldivesdream.com" },
    update: {},
    create: {
      email: "staff@maldivesdream.com",
      passwordHash: await bcrypt.hash("staff12345", 12),
      name: "Staff User",
      role: "STAFF",
    },
  });
  console.log(`✓ Staff user: ${staff.email} (password: staff12345)`);

  // ── Hotels ───────────────────────────────────────────────────────────────
  const hotel1 = await prisma.hotel.upsert({
    where: { slug: "azure-paradise-resort" },
    update: {},
    create: {
      name: "Azure Paradise Resort & Spa",
      slug: "azure-paradise-resort",
      island: "Maafushi",
      atoll: "Kaafu Atoll",
      description:
        "Nestled on the pristine shores of Maafushi, Azure Paradise Resort & Spa offers an unparalleled luxury experience in the heart of the Maldives. With overwater villas featuring glass floors, a world-class spa, and direct access to vibrant coral reefs, every moment is a celebration of island life.\n\nOur resort features 3 restaurants, 2 bars, an infinity pool, a PADI dive center, and complimentary sunset dolphin cruises.",
      amenities: [
        "Infinity Pool",
        "Spa & Wellness Center",
        "PADI Dive Center",
        "Water Sports",
        "3 Restaurants",
        "Beach Bar",
        "Free WiFi",
        "Airport Transfer",
        "Gym",
        "Kids Club",
      ],
      policies: {
        cancellation: "Free cancellation up to 14 days before check-in. 50% charge for cancellations within 14 days.",
        checkIn: "From 14:00. Early check-in subject to availability.",
        checkOut: "By 12:00. Late check-out available on request.",
        childPolicy: "Children welcome. Under 6 stay free with existing bedding.",
        petPolicy: "No pets allowed.",
      },
      checkInTime: "14:00",
      checkOutTime: "12:00",
      contactEmail: "reservations@azureparadise.mv",
      contactPhone: "+960 664-1234",
      address: "Azure Paradise Resort, Maafushi, Kaafu Atoll, Maldives",
      latitude: 3.9434,
      longitude: 73.4901,
      starRating: 5,
      status: "ACTIVE",
    },
  });

  const hotel2 = await prisma.hotel.upsert({
    where: { slug: "coral-island-retreat" },
    update: {},
    create: {
      name: "Coral Island Retreat",
      slug: "coral-island-retreat",
      island: "Dhigurah",
      atoll: "Alif Dhaal Atoll",
      description:
        "A boutique eco-resort on the stunning island of Dhigurah, known for its 3km pristine beach and whale shark encounters. Coral Island Retreat combines sustainable luxury with authentic Maldivian hospitality.\n\nFeaturing beachfront bungalows and garden villas surrounded by lush tropical vegetation, this is the perfect escape for nature lovers and adventure seekers.",
      amenities: [
        "Beachfront Restaurant",
        "Snorkeling Gear",
        "Whale Shark Excursions",
        "Kayaking",
        "Free WiFi",
        "Airport Transfer",
        "Yoga Pavilion",
        "Sunset Fishing",
      ],
      policies: {
        cancellation: "Free cancellation up to 7 days before check-in.",
        checkIn: "From 14:00",
        checkOut: "By 11:00",
      },
      checkInTime: "14:00",
      checkOutTime: "11:00",
      contactEmail: "hello@coralislandretreat.mv",
      contactPhone: "+960 668-5678",
      latitude: 3.5076,
      longitude: 72.9288,
      starRating: 4,
      status: "ACTIVE",
    },
  });

  console.log(`✓ Hotels: ${hotel1.name}, ${hotel2.name}`);

  // ── Room Types ───────────────────────────────────────────────────────────
  const waterVilla = await prisma.roomType.upsert({
    where: { hotelId_slug: { hotelId: hotel1.id, slug: "overwater-villa" } },
    update: {},
    create: {
      hotelId: hotel1.id,
      name: "Overwater Villa",
      slug: "overwater-villa",
      description:
        "Suspended over the turquoise lagoon, our Overwater Villas feature glass floor panels, a private sundeck with direct ocean access, outdoor rain shower, and breathtaking sunset views. The perfect romantic hideaway.",
      maxGuests: 3,
      bedType: "King",
      baseFeatures: ["Glass Floor", "Private Sundeck", "Ocean Access", "Outdoor Shower", "Minibar", "Nespresso Machine", "Smart TV", "Free WiFi"],
      inventoryCount: 20,
      sizeM2: 85,
    },
  });

  const beachVilla = await prisma.roomType.upsert({
    where: { hotelId_slug: { hotelId: hotel1.id, slug: "beach-villa" } },
    update: {},
    create: {
      hotelId: hotel1.id,
      name: "Beach Villa",
      slug: "beach-villa",
      description:
        "Steps from the white sand beach, our Beach Villas offer private garden courtyards with plunge pools, indoor-outdoor living spaces, and direct beach access. Ideal for families and those who love the sand between their toes.",
      maxGuests: 4,
      bedType: "King + Sofa Bed",
      baseFeatures: ["Private Plunge Pool", "Garden Courtyard", "Beach Access", "Outdoor Bathtub", "Minibar", "Smart TV", "Free WiFi"],
      inventoryCount: 15,
      sizeM2: 110,
    },
  });

  const beachBungalow = await prisma.roomType.upsert({
    where: { hotelId_slug: { hotelId: hotel2.id, slug: "beach-bungalow" } },
    update: {},
    create: {
      hotelId: hotel2.id,
      name: "Beach Bungalow",
      slug: "beach-bungalow",
      description:
        "Charming thatched-roof bungalows right on the 3km beach. Simple luxury with ocean views, private terrace, and hammock. Fall asleep to the sound of waves.",
      maxGuests: 2,
      bedType: "King",
      baseFeatures: ["Ocean View", "Private Terrace", "Hammock", "Fan + AC", "Free WiFi"],
      inventoryCount: 10,
      sizeM2: 45,
    },
  });

  const gardenVilla2 = await prisma.roomType.upsert({
    where: { hotelId_slug: { hotelId: hotel2.id, slug: "garden-villa" } },
    update: {},
    create: {
      hotelId: hotel2.id,
      name: "Garden Villa",
      slug: "garden-villa",
      description:
        "Tucked among tropical palms and flowering plants, our Garden Villas offer a serene retreat with private outdoor shower and short walk to the beach.",
      maxGuests: 3,
      bedType: "King + Daybed",
      baseFeatures: ["Tropical Garden", "Outdoor Shower", "Ceiling Fan", "AC", "Free WiFi"],
      inventoryCount: 8,
      sizeM2: 55,
    },
  });

  console.log(
    `✓ Room types: ${waterVilla.name}, ${beachVilla.name}, ${beachBungalow.name}, ${gardenVilla2.name}`
  );

  // ── Seasons ──────────────────────────────────────────────────────────────
  const peakSeason = await prisma.season.create({
    data: {
      name: "Peak Season 2026",
      startDate: new Date("2025-12-15"),
      endDate: new Date("2026-04-30"),
      active: true,
    },
  });

  const greenSeason = await prisma.season.create({
    data: {
      name: "Green Season 2026",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-10-31"),
      active: true,
    },
  });

  const festive = await prisma.season.create({
    data: {
      name: "Festive Season 2026",
      startDate: new Date("2026-12-20"),
      endDate: new Date("2027-01-10"),
      active: true,
    },
  });

  console.log(`✓ Seasons: ${peakSeason.name}, ${greenSeason.name}, ${festive.name}`);

  // ── Seasonal Prices ──────────────────────────────────────────────────────
  const priceData = [
    // Azure Paradise - Overwater Villa
    { roomTypeId: waterVilla.id, seasonId: peakSeason.id, nightlyPrice: 850, minNights: 3 },
    { roomTypeId: waterVilla.id, seasonId: greenSeason.id, nightlyPrice: 550, minNights: 2 },
    { roomTypeId: waterVilla.id, seasonId: festive.id, nightlyPrice: 1200, minNights: 5 },
    // Azure Paradise - Beach Villa
    { roomTypeId: beachVilla.id, seasonId: peakSeason.id, nightlyPrice: 650, minNights: 3 },
    { roomTypeId: beachVilla.id, seasonId: greenSeason.id, nightlyPrice: 420, minNights: 2 },
    { roomTypeId: beachVilla.id, seasonId: festive.id, nightlyPrice: 950, minNights: 5 },
    // Coral Island - Beach Bungalow
    { roomTypeId: beachBungalow.id, seasonId: peakSeason.id, nightlyPrice: 280, minNights: 2 },
    { roomTypeId: beachBungalow.id, seasonId: greenSeason.id, nightlyPrice: 180, minNights: 1 },
    { roomTypeId: beachBungalow.id, seasonId: festive.id, nightlyPrice: 380, minNights: 3 },
    // Coral Island - Garden Villa
    { roomTypeId: gardenVilla2.id, seasonId: peakSeason.id, nightlyPrice: 220, minNights: 2 },
    { roomTypeId: gardenVilla2.id, seasonId: greenSeason.id, nightlyPrice: 150, minNights: 1 },
    { roomTypeId: gardenVilla2.id, seasonId: festive.id, nightlyPrice: 300, minNights: 3 },
  ];

  for (const p of priceData) {
    await prisma.seasonalPrice.create({
      data: {
        roomTypeId: p.roomTypeId,
        seasonId: p.seasonId,
        nightlyPrice: p.nightlyPrice,
        currency: "USD",
        minNights: p.minNights,
      },
    });
  }
  console.log(`✓ Seasonal prices: ${priceData.length} price entries`);

  // ── Sample Photos (placeholder URLs) ─────────────────────────────────────
  const photoData = [
    { hotelId: hotel1.id, url: "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200", altText: "Azure Paradise aerial view", sortOrder: 0 },
    { hotelId: hotel1.id, url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200", altText: "Overwater villas at sunset", sortOrder: 1 },
    { hotelId: hotel1.id, url: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200", altText: "Crystal clear lagoon", sortOrder: 2 },
    { hotelId: hotel2.id, url: "https://images.unsplash.com/photo-1586861203927-800a5acdcc4d?w=1200", altText: "Coral Island beach", sortOrder: 0 },
    { hotelId: hotel2.id, url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200", altText: "Tropical sunset view", sortOrder: 1 },
    { roomTypeId: waterVilla.id, url: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200", altText: "Overwater villa interior", sortOrder: 0 },
    { roomTypeId: beachVilla.id, url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200", altText: "Beach villa with pool", sortOrder: 0 },
    { roomTypeId: beachBungalow.id, url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200", altText: "Beachfront bungalow", sortOrder: 0 },
  ];

  for (const p of photoData) {
    await prisma.photo.create({
      data: {
        hotelId: p.hotelId || null,
        roomTypeId: p.roomTypeId || null,
        url: p.url,
        key: `seed/${p.altText?.replace(/\s/g, "-").toLowerCase()}.jpg`,
        altText: p.altText,
        sortOrder: p.sortOrder,
        mimeType: "image/jpeg",
      },
    });
  }
  console.log(`✓ Photos: ${photoData.length} sample images`);

  console.log("\n🌊 Seeding complete! Your Maldives Dream is ready.\n");
  console.log("Admin login: admin@maldivesdream.com / admin123456");
  console.log("Staff login: staff@maldivesdream.com / staff12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
