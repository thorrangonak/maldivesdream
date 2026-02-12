// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface NightlyRate {
  date: string; // YYYY-MM-DD
  price: number;
  seasonName: string;
}

export interface PricingBreakdown {
  nightlyRates: NightlyRate[];
  subtotal: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  roomQty: number;
}

// ─── Availability ────────────────────────────────────────────────────────────

export interface AvailabilityResult {
  roomTypeId: string;
  available: boolean;
  availableRooms: number; // min across date range
  pricing: PricingBreakdown | null;
  missingPriceDates: string[]; // dates with no seasonal price
}

// ─── Booking Request ─────────────────────────────────────────────────────────

export interface BookingRequest {
  hotelId: string;
  roomTypeId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  guestCount: number;
  roomQty: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCountry?: string;
  specialRequests?: string;
}

// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ─── Admin Reports ───────────────────────────────────────────────────────────

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  bookingCount: number;
  currency: string;
  byHotel?: { hotelId: string; hotelName: string; revenue: number; bookings: number }[];
  byRoomType?: { roomTypeId: string; roomTypeName: string; revenue: number; bookings: number }[];
  byPaymentMethod?: { provider: string; revenue: number; count: number }[];
}

export interface OccupancyReport {
  period: string;
  totalRoomNights: number;
  occupiedRoomNights: number;
  occupancyRate: number;
  byHotel?: { hotelId: string; hotelName: string; rate: number }[];
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export type DecimalLike = number | string;
