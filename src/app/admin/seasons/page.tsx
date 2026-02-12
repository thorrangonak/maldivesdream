"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  CalendarDays,
  DollarSign,
  X,
  RefreshCw,
} from "lucide-react";

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  _count?: { prices: number };
}

interface SeasonalPrice {
  id: string;
  nightlyPrice: number;
  currency: string;
  minNights: number;
  roomType: { id: string; name: string; hotel: { id: string; name: string } };
  season: { id: string; name: string; startDate: string; endDate: string };
}

interface RoomType {
  id: string;
  name: string;
  hotel: { id: string; name: string };
}

const emptySeasonForm = {
  name: "",
  startDate: "",
  endDate: "",
  active: true,
};

const emptyPriceForm = {
  roomTypeId: "",
  seasonId: "",
  nightlyPrice: 500,
  currency: "USD",
  minNights: 1,
};

export default function AdminSeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [prices, setPrices] = useState<SeasonalPrice[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [seasonForm, setSeasonForm] = useState(emptySeasonForm);
  const [priceForm, setPriceForm] = useState(emptyPriceForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [seasonRes, priceRes, roomRes] = await Promise.all([
        fetch("/api/admin/seasons"),
        fetch("/api/admin/prices?pageSize=100"),
        fetch("/api/admin/room-types?pageSize=100"),
      ]);
      const seasonJson = await seasonRes.json();
      const priceJson = await priceRes.json();
      const roomJson = await roomRes.json();
      setSeasons(Array.isArray(seasonJson.data) ? seasonJson.data : []);
      setPrices(priceJson.data?.prices || []);
      setRoomTypes(roomJson.data?.roomTypes || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...seasonForm,
          active: seasonForm.active,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create season");
      }
      setShowSeasonForm(false);
      setSeasonForm(emptySeasonForm);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create season");
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...priceForm,
          nightlyPrice: Number(priceForm.nightlyPrice),
          minNights: Number(priceForm.minNights),
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create price");
      }
      setShowPriceForm(false);
      setPriceForm(emptyPriceForm);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create price");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch {
      return d;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Seasons & Pricing
          </h1>
          <p className="text-slate-500">
            Manage seasons and seasonal room prices
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Seasons Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Seasons</h2>
          <Button
            size="sm"
            onClick={() => {
              setShowSeasonForm(true);
              setError("");
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Season
          </Button>
        </div>

        {showSeasonForm && (
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Create Season
                </h3>
                <button onClick={() => setShowSeasonForm(false)}>
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreateSeason}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Input
                  label="Season Name"
                  id="seasonName"
                  value={seasonForm.name}
                  onChange={(e) =>
                    setSeasonForm({ ...seasonForm, name: e.target.value })
                  }
                  required
                  placeholder="Peak Season 2026"
                />
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={seasonForm.active}
                      onChange={(e) =>
                        setSeasonForm({
                          ...seasonForm,
                          active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Active
                  </label>
                </div>
                <Input
                  label="Start Date"
                  id="startDate"
                  type="date"
                  value={seasonForm.startDate}
                  onChange={(e) =>
                    setSeasonForm({
                      ...seasonForm,
                      startDate: e.target.value,
                    })
                  }
                  required
                />
                <Input
                  label="End Date"
                  id="endDate"
                  type="date"
                  value={seasonForm.endDate}
                  onChange={(e) =>
                    setSeasonForm({ ...seasonForm, endDate: e.target.value })
                  }
                  required
                />
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowSeasonForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    Create Season
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="mt-4 text-center text-sm text-slate-500">Loading...</p>
        ) : seasons.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center py-8">
              <CalendarDays className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No seasons defined</p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Start</th>
                  <th className="pb-2 pr-4 font-medium">End</th>
                  <th className="pb-2 pr-4 font-medium">Prices</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {fmtDate(s.startDate)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {fmtDate(s.endDate)}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {s._count?.prices ?? 0}
                    </td>
                    <td className="py-2.5">
                      <Badge status={s.active ? "ACTIVE" : "INACTIVE"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prices Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Seasonal Prices
          </h2>
          <Button
            size="sm"
            onClick={() => {
              setPriceForm({
                ...emptyPriceForm,
                roomTypeId: roomTypes.length > 0 ? roomTypes[0].id : "",
                seasonId: seasons.length > 0 ? seasons[0].id : "",
              });
              setShowPriceForm(true);
              setError("");
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Price
          </Button>
        </div>

        {showPriceForm && (
          <Card className="mt-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Create Seasonal Price
                </h3>
                <button onClick={() => setShowPriceForm(false)}>
                  <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleCreatePrice}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="space-y-1">
                  <label
                    htmlFor="priceRoomType"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Room Type
                  </label>
                  <select
                    id="priceRoomType"
                    value={priceForm.roomTypeId}
                    onChange={(e) =>
                      setPriceForm({
                        ...priceForm,
                        roomTypeId: e.target.value,
                      })
                    }
                    required
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select room type</option>
                    {roomTypes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.hotel?.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="priceSeason"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Season
                  </label>
                  <select
                    id="priceSeason"
                    value={priceForm.seasonId}
                    onChange={(e) =>
                      setPriceForm({
                        ...priceForm,
                        seasonId: e.target.value,
                      })
                    }
                    required
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select season</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Nightly Price (USD)"
                  id="nightlyPrice"
                  type="number"
                  min={1}
                  step="0.01"
                  value={priceForm.nightlyPrice}
                  onChange={(e) =>
                    setPriceForm({
                      ...priceForm,
                      nightlyPrice: Number(e.target.value),
                    })
                  }
                  required
                />
                <Input
                  label="Min Nights"
                  id="minNights"
                  type="number"
                  min={1}
                  value={priceForm.minNights}
                  onChange={(e) =>
                    setPriceForm({
                      ...priceForm,
                      minNights: Number(e.target.value),
                    })
                  }
                  required
                />
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowPriceForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    Create Price
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="mt-4 text-center text-sm text-slate-500">Loading...</p>
        ) : prices.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="flex flex-col items-center py-8">
              <DollarSign className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                No seasonal prices defined
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Room Type</th>
                  <th className="pb-2 pr-4 font-medium">Hotel</th>
                  <th className="pb-2 pr-4 font-medium">Season</th>
                  <th className="pb-2 pr-4 font-medium">Nightly Price</th>
                  <th className="pb-2 font-medium">Min Nights</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {p.roomType?.name}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {p.roomType?.hotel?.name}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">
                      {p.season?.name}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-900">
                      {formatCurrency(Number(p.nightlyPrice))}
                    </td>
                    <td className="py-2.5 text-slate-600">{p.minNights}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
