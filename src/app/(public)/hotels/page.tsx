import Link from "next/link";
import prisma from "@/lib/db/client";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  atoll?: string;
  page?: string;
}

export default async function HotelsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search = params.search || "";
  const atoll = params.atoll || "";
  const page = Math.max(1, parseInt(params.page || "1"));
  const pageSize = 12;

  const where = {
    status: "ACTIVE" as const,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { island: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(atoll && { atoll: { contains: atoll, mode: "insensitive" as const } }),
  };

  const [hotels, total, atolls] = await Promise.all([
    prisma.hotel.findMany({
      where,
      include: {
        photos: { where: { roomTypeId: null }, orderBy: { sortOrder: "asc" }, take: 1 },
        roomTypes: {
          where: { active: true },
          include: {
            seasonalPrices: { where: { active: true }, orderBy: { nightlyPrice: "asc" }, take: 1 },
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.hotel.count({ where }),
    prisma.hotel.findMany({
      where: { status: "ACTIVE" },
      select: { atoll: true },
      distinct: ["atoll"],
      orderBy: { atoll: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-900">Explore Resorts</h1>
      <p className="mt-1 text-slate-500">Find your perfect island escape in the Maldives</p>

      {/* Filters */}
      <form className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          placeholder="Search resorts..."
          defaultValue={search}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <select
          name="atoll"
          defaultValue={atoll}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">All Atolls</option>
          {atolls.map((a) => (
            <option key={a.atoll} value={a.atoll}>{a.atoll}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Search
        </button>
      </form>

      {/* Results */}
      {hotels.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">No resorts found. Try adjusting your search.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => {
            const lowestPrice = hotel.roomTypes
              .flatMap((rt) => rt.seasonalPrices)
              .sort((a, b) => Number(a.nightlyPrice) - Number(b.nightlyPrice))[0];

            return (
              <Link
                key={hotel.id}
                href={`/hotels/${hotel.slug}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {hotel.photos[0] ? (
                    <img
                      src={hotel.photos[0].url}
                      alt={hotel.photos[0].altText || hotel.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">No photo</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                        {hotel.name}
                      </h2>
                      <p className="text-sm text-slate-500">{hotel.island}, {hotel.atoll}</p>
                    </div>
                    {hotel.starRating && (
                      <span className="text-sm text-yellow-500">{"★".repeat(hotel.starRating)}</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{hotel.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    {lowestPrice && (
                      <p className="text-sm text-slate-900">
                        From{" "}
                        <span className="text-lg font-bold text-sky-600">
                          {formatCurrency(Number(lowestPrice.nightlyPrice))}
                        </span>
                        <span className="text-slate-400"> /night</span>
                      </p>
                    )}
                    <span className="text-sm font-medium text-sky-600 group-hover:underline">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/hotels?${new URLSearchParams({ search, atoll, page: String(p) })}`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                p === page
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
