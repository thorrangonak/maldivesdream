"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  BarChart3,
  Building,
  CreditCard,
  BedDouble,
  RefreshCw,
} from "lucide-react";

interface RevenueReport {
  period: string;
  totalRevenue: number;
  bookingCount: number;
  currency: string;
  byHotel: { hotelId: string; hotelName: string; revenue: number; bookings: number }[];
  byRoomType: { roomTypeId: string; roomTypeName: string; revenue: number; bookings: number }[];
  byPaymentMethod: { provider: string; revenue: number; count: number }[];
}

interface OccupancyReport {
  period: string;
  totalRoomNights: number;
  occupiedRoomNights: number;
  occupancyRate: number;
  byHotel: { hotelId: string; hotelName: string; rate: number }[];
}

export default function AdminReportsPage() {
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Default to last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [startDate, setStartDate] = useState(
    thirtyDaysAgo.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  const fetchReports = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ startDate, endDate });
      const [revRes, occRes] = await Promise.all([
        fetch(`/api/admin/reports/revenue?${params}`),
        fetch(`/api/admin/reports/occupancy?${params}`),
      ]);

      const revJson = await revRes.json();
      const occJson = await occRes.json();

      if (!revRes.ok) throw new Error(revJson.error || "Revenue report failed");
      if (!occRes.ok)
        throw new Error(occJson.error || "Occupancy report failed");

      setRevenue(revJson.data);
      setOccupancy(occJson.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const avgBookingValue =
    revenue && revenue.bookingCount > 0
      ? revenue.totalRevenue / revenue.bookingCount
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500">Revenue and occupancy analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Date Range */}
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <Input
          label="Start Date"
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button onClick={fetchReports} loading={loading}>
          Generate Reports
        </Button>
      </div>

      {loading && (
        <p className="mt-8 text-center text-sm text-slate-500">
          Loading reports...
        </p>
      )}

      {!loading && revenue && occupancy && (
        <>
          {/* Summary Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(revenue.totalRevenue)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Bookings</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {revenue.bookingCount}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Avg Booking Value</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(avgBookingValue)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-4 py-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <BedDouble className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Occupancy Rate</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {occupancy.occupancyRate}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Hotel */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">
                    Revenue by Hotel
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                {revenue.byHotel.length === 0 ? (
                  <p className="text-sm text-slate-500">No data</p>
                ) : (
                  <div className="space-y-3">
                    {revenue.byHotel.map((h) => (
                      <div
                        key={h.hotelId}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {h.hotelName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {h.bookings} booking{h.bookings !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(h.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Payment Method */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">
                    Revenue by Payment Method
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                {revenue.byPaymentMethod.length === 0 ? (
                  <p className="text-sm text-slate-500">No data</p>
                ) : (
                  <div className="space-y-3">
                    {revenue.byPaymentMethod.map((m) => (
                      <div
                        key={m.provider}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {m.provider}
                          </p>
                          <p className="text-xs text-slate-500">
                            {m.count} payment{m.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(m.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Occupancy by Hotel */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">
                    Occupancy by Hotel
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                {occupancy.byHotel.length === 0 ? (
                  <p className="text-sm text-slate-500">No data</p>
                ) : (
                  <div className="space-y-3">
                    {occupancy.byHotel.map((h) => (
                      <div key={h.hotelId}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-slate-900">
                            {h.hotelName}
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {h.rate}%
                          </p>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-teal-500 transition-all"
                            style={{ width: `${Math.min(h.rate, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Occupancy Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-500" />
                  <h2 className="font-semibold text-slate-900">
                    Occupancy Summary
                  </h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">
                      Total Room Nights
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {occupancy.totalRoomNights}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">
                      Occupied Room Nights
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {occupancy.occupiedRoomNights}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">
                      Overall Occupancy
                    </span>
                    <span className="text-sm font-bold text-teal-600">
                      {occupancy.occupancyRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Period</span>
                    <span className="text-sm text-slate-600">
                      {occupancy.period}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
