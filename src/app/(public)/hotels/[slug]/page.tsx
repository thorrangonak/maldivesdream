import { notFound } from "next/navigation";
import prisma from "@/lib/db/client";
import { formatCurrency } from "@/lib/utils";
import { BookingWidget } from "@/components/booking/booking-widget";
import { MapPin, Clock, Phone, Mail, Wifi, Star } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HotelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const hotel = await prisma.hotel.findFirst({
    where: { OR: [{ slug }, { id: slug }], status: "ACTIVE" },
    include: {
      photos: { where: { roomTypeId: null }, orderBy: { sortOrder: "asc" } },
      roomTypes: {
        where: { active: true },
        include: {
          photos: { orderBy: { sortOrder: "asc" }, take: 3 },
          seasonalPrices: {
            where: { active: true },
            include: { season: true },
            orderBy: { nightlyPrice: "asc" },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!hotel) notFound();

  const amenities = (hotel.amenities as string[]) || [];

  return (
    <div>
      {/* Gallery */}
      <div className="grid h-[50vh] grid-cols-4 gap-1">
        {hotel.photos.slice(0, 4).map((photo, i) => (
          <div
            key={photo.id}
            className={`relative ${i === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <img
              src={photo.url}
              alt={photo.altText || hotel.name}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
        {hotel.photos.length === 0 && (
          <div className="col-span-4 flex items-center justify-center bg-slate-100 text-slate-400">
            No photos available
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{hotel.name}</h1>
                <p className="mt-1 flex items-center gap-1 text-slate-500">
                  <MapPin className="h-4 w-4" />
                  {hotel.island}, {hotel.atoll}
                </p>
              </div>
              {hotel.starRating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 text-slate-700 leading-relaxed whitespace-pre-line">
              {hotel.description}
            </div>

            {/* Info */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-slate-400" />
                Check-in: {hotel.checkInTime} / Check-out: {hotel.checkOutTime}
              </span>
              {hotel.contactPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {hotel.contactPhone}
                </span>
              )}
              {hotel.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {hotel.contactEmail}
                </span>
              )}
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-slate-900">Amenities</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700"
                    >
                      <Wifi className="h-3.5 w-3.5" />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            <div className="mt-10">
              <h2 className="text-xl font-semibold text-slate-900">Room Types</h2>
              <div className="mt-4 space-y-6">
                {hotel.roomTypes.map((room) => {
                  const lowestPrice = room.seasonalPrices[0];
                  const features = (room.baseFeatures as string[]) || [];

                  return (
                    <div
                      key={room.id}
                      className="flex flex-col overflow-hidden rounded-xl border border-slate-200 sm:flex-row"
                    >
                      <div className="aspect-[4/3] w-full bg-slate-100 sm:w-64 sm:shrink-0">
                        {room.photos[0] ? (
                          <img src={room.photos[0].url} alt={room.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-400">No photo</div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            Up to {room.maxGuests} guests &middot; {room.bedType}
                            {room.sizeM2 && ` · ${room.sizeM2}m²`}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{room.description}</p>
                          {features.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {features.slice(0, 5).map((f) => (
                                <span key={f} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                  {f}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          {lowestPrice ? (
                            <p className="text-sm">
                              From{" "}
                              <span className="text-xl font-bold text-sky-600">
                                {formatCurrency(Number(lowestPrice.nightlyPrice))}
                              </span>
                              <span className="text-slate-400"> /night</span>
                            </p>
                          ) : (
                            <p className="text-sm text-slate-400">Pricing unavailable</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <BookingWidget
              hotelId={hotel.id}
              roomTypes={hotel.roomTypes.map((rt) => ({
                id: rt.id,
                name: rt.name,
                maxGuests: rt.maxGuests,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
