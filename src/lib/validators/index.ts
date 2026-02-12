import { z } from "zod";

// ─── Common ──────────────────────────────────────────────────────────────────

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Availability ────────────────────────────────────────────────────────────

export const availabilityQuerySchema = z
  .object({
    hotelId: z.string().min(1),
    roomTypeId: z.string().min(1).optional(),
    checkIn: dateStr,
    checkOut: dateStr,
    guests: z.coerce.number().int().min(1).default(2),
    qty: z.coerce.number().int().min(1).default(1),
  })
  .refine((d) => d.checkIn < d.checkOut, {
    message: "checkOut must be after checkIn",
  });

// ─── Reservation ─────────────────────────────────────────────────────────────

export const createReservationSchema = z.object({
  hotelId: z.string().min(1),
  roomTypeId: z.string().min(1),
  checkIn: dateStr,
  checkOut: dateStr,
  guestCount: z.number().int().min(1),
  roomQty: z.number().int().min(1).default(1),
  guestFirstName: z.string().min(1).max(100),
  guestLastName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().max(30).optional(),
  guestCountry: z.string().max(2).optional(),
  specialRequests: z.string().max(2000).optional(),
});

// ─── Payment ─────────────────────────────────────────────────────────────────

export const createStripeSessionSchema = z.object({
  reservationId: z.string().min(1),
});

export const createCryptoCheckoutSchema = z.object({
  reservationId: z.string().min(1),
});

// ─── Admin: Hotel ────────────────────────────────────────────────────────────

export const createHotelSchema = z.object({
  name: z.string().min(1).max(200),
  island: z.string().min(1).max(100),
  atoll: z.string().min(1).max(100),
  description: z.string().min(1),
  amenities: z.array(z.string()),
  policies: z.record(z.string(), z.unknown()).optional(),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/).default("14:00"),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).default("12:00"),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
});

export const updateHotelSchema = createHotelSchema.partial();

// ─── Admin: Room Type ────────────────────────────────────────────────────────

export const createRoomTypeSchema = z.object({
  hotelId: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  maxGuests: z.number().int().min(1),
  bedType: z.string().min(1),
  baseFeatures: z.array(z.string()),
  inventoryCount: z.number().int().min(0),
  sizeM2: z.number().positive().optional(),
});

export const updateRoomTypeSchema = createRoomTypeSchema.partial().omit({ hotelId: true });

// ─── Admin: Season ───────────────────────────────────────────────────────────

const seasonFields = z.object({
  name: z.string().min(1).max(200),
  startDate: dateStr,
  endDate: dateStr,
  active: z.boolean().default(true),
});

export const createSeasonSchema = seasonFields.refine((d) => d.startDate < d.endDate, {
  message: "endDate must be after startDate",
});

export const updateSeasonSchema = seasonFields.partial();

// ─── Admin: Seasonal Price ───────────────────────────────────────────────────

export const createSeasonalPriceSchema = z.object({
  roomTypeId: z.string().min(1),
  seasonId: z.string().min(1),
  nightlyPrice: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  minNights: z.number().int().min(1).default(1),
  promoRules: z.record(z.string(), z.unknown()).optional(),
});

export const updateSeasonalPriceSchema = createSeasonalPriceSchema.partial().omit({
  roomTypeId: true,
  seasonId: true,
});

// ─── Admin: Reservation Update ───────────────────────────────────────────────

export const updateReservationSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "REFUNDED"]).optional(),
  cancelReason: z.string().max(500).optional(),
});

// ─── Admin: Auth ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(200),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "STAFF"]).default("STAFF"),
});

// ─── Manage Booking ──────────────────────────────────────────────────────────

export const lookupBookingSchema = z.object({
  code: z.string().min(1),
  email: z.string().email(),
});
