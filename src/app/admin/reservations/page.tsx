"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Search,
  Download,
  Check,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";

interface Reservation {
  id: string;
  code: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomQty: number;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  hotel: { id: string; name: string };
  roomType: { id: string; name: string };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchReservations = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
        });
        if (statusFilter) params.set("status", statusFilter);
        if (search) params.set("search", search);

        const res = await fetch(`/api/admin/reservations?${params}`);
        const json = await res.json();
        setReservations(json.data?.reservations || []);
        setPagination(
          json.data?.pagination || {
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0,
          }
        );
      } catch {
        setError("Failed to load reservations");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search]
  );

  useEffect(() => {
    fetchReservations(1);
  }, [fetchReservations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleAction = async (
    id: string,
    status: "CONFIRMED" | "CANCELLED" | "REFUNDED"
  ) => {
    let cancelReason: string | undefined;
    if (status === "CANCELLED") {
      const reason = prompt("Enter cancellation reason:");
      if (!reason) return;
      cancelReason = reason;
    }

    if (status === "REFUNDED") {
      if (!confirm("Are you sure you want to refund this reservation?")) return;
    }

    setActionLoading(id);
    setError("");
    try {
      const body: Record<string, string> = { status };
      if (cancelReason) body.cancelReason = cancelReason;

      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Action failed");
      }
      fetchReservations(pagination.page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch {
      return d;
    }
  };

  const exportUrl = (() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    return `/api/admin/reservations/export?${params}`;
  })();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservations</h1>
          <p className="text-slate-500">
            Manage bookings &mdash; {pagination.total} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReservations(pagination.page)}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
          <a href={exportUrl} download>
            <Button variant="outline" size="sm">
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search code, email, name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm" type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          Loading reservations...
        </p>
      ) : reservations.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-12">
            <BookOpen className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No reservations found
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Code</th>
                  <th className="pb-2 pr-3 font-medium">Guest</th>
                  <th className="pb-2 pr-3 font-medium">Hotel</th>
                  <th className="pb-2 pr-3 font-medium">Room</th>
                  <th className="pb-2 pr-3 font-medium">Dates</th>
                  <th className="pb-2 pr-3 font-medium">Amount</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-3 font-mono text-sky-600">
                      {r.code}
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-slate-900">
                        {r.guestFirstName} {r.guestLastName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {r.guestEmail}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {r.hotel?.name}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {r.roomType?.name}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {fmtDate(r.checkIn)} &mdash; {fmtDate(r.checkOut)}
                      <div className="text-xs">
                        {r.nights} night{r.nights !== 1 ? "s" : ""}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-slate-900">
                      {formatCurrency(Number(r.totalAmount), r.currency)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        {r.status === "PENDING" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(r.id, "CONFIRMED")}
                            disabled={actionLoading === r.id}
                            title="Confirm"
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {(r.status === "PENDING" ||
                          r.status === "CONFIRMED") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(r.id, "CANCELLED")}
                            disabled={actionLoading === r.id}
                            title="Cancel"
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                        {r.status === "CONFIRMED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(r.id, "REFUNDED")}
                            disabled={actionLoading === r.id}
                            title="Refund"
                          >
                            <RotateCcw className="h-4 w-4 text-slate-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} results)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchReservations(pagination.page - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchReservations(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
