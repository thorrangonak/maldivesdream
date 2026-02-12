"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, BedDouble, X, RefreshCw, Pencil } from "lucide-react";

interface Hotel {
  id: string;
  name: string;
}

interface RoomType {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
  bedType: string;
  inventoryCount: number;
  sizeM2: number | null;
  baseFeatures: string[];
  description: string;
  active: boolean;
  hotel: { id: string; name: string };
  _count?: { seasonalPrices: number; reservations: number };
}

const emptyForm = {
  hotelId: "",
  name: "",
  description: "",
  maxGuests: 2,
  bedType: "KING",
  baseFeatures: "",
  inventoryCount: 1,
  sizeM2: 40,
};

export default function AdminRoomsPage() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomRes, hotelRes] = await Promise.all([
        fetch("/api/admin/room-types?pageSize=100"),
        fetch("/api/admin/hotels?pageSize=100"),
      ]);
      const roomJson = await roomRes.json();
      const hotelJson = await hotelRes.json();
      setRoomTypes(roomJson.data?.roomTypes || []);
      setHotels(hotelJson.data?.hotels || []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      hotelId: hotels.length > 0 ? hotels[0].id : "",
    });
    setShowForm(true);
    setError("");
  };

  const openEdit = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/room-types/${id}`);
      const json = await res.json();
      const r = json.data;
      setEditingId(id);
      setForm({
        hotelId: r.hotelId || "",
        name: r.name || "",
        description: r.description || "",
        maxGuests: r.maxGuests || 2,
        bedType: r.bedType || "KING",
        baseFeatures: Array.isArray(r.baseFeatures)
          ? r.baseFeatures.join(", ")
          : "",
        inventoryCount: r.inventoryCount || 1,
        sizeM2: r.sizeM2 || 40,
      });
      setShowForm(true);
    } catch {
      setError("Failed to load room type details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      maxGuests: Number(form.maxGuests),
      inventoryCount: Number(form.inventoryCount),
      sizeM2: Number(form.sizeM2),
      baseFeatures: form.baseFeatures
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const url = editingId
        ? `/api/admin/room-types/${editingId}`
        : "/api/admin/room-types";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Save failed");
      }
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Room Types</h1>
          <p className="text-slate-500">Manage room categories and inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Room Type
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Room Type" : "Create Room Type"}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="hotelId"
                  className="block text-sm font-medium text-slate-700"
                >
                  Hotel
                </label>
                <select
                  id="hotelId"
                  value={form.hotelId}
                  onChange={(e) =>
                    setForm({ ...form, hotelId: e.target.value })
                  }
                  required
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">Select a hotel</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Name"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Overwater Villa"
              />
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <Input
                label="Max Guests"
                id="maxGuests"
                type="number"
                min={1}
                max={20}
                value={form.maxGuests}
                onChange={(e) =>
                  setForm({ ...form, maxGuests: Number(e.target.value) })
                }
                required
              />
              <div className="space-y-1">
                <label
                  htmlFor="bedType"
                  className="block text-sm font-medium text-slate-700"
                >
                  Bed Type
                </label>
                <select
                  id="bedType"
                  value={form.bedType}
                  onChange={(e) =>
                    setForm({ ...form, bedType: e.target.value })
                  }
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="KING">King</option>
                  <option value="QUEEN">Queen</option>
                  <option value="TWIN">Twin</option>
                  <option value="DOUBLE">Double</option>
                  <option value="SINGLE">Single</option>
                </select>
              </div>
              <Input
                label="Base Features (comma-separated)"
                id="baseFeatures"
                value={form.baseFeatures}
                onChange={(e) =>
                  setForm({ ...form, baseFeatures: e.target.value })
                }
                placeholder="Ocean view, Private pool, Mini bar"
              />
              <Input
                label="Inventory Count"
                id="inventoryCount"
                type="number"
                min={1}
                value={form.inventoryCount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    inventoryCount: Number(e.target.value),
                  })
                }
                required
              />
              <Input
                label="Size (m2)"
                id="sizeM2"
                type="number"
                min={1}
                value={form.sizeM2}
                onChange={(e) =>
                  setForm({ ...form, sizeM2: Number(e.target.value) })
                }
              />
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {editingId ? "Update Room Type" : "Create Room Type"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          Loading room types...
        </p>
      ) : roomTypes.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-12">
            <BedDouble className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No room types found</p>
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first room type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Hotel</th>
                <th className="pb-2 pr-4 font-medium">Max Guests</th>
                <th className="pb-2 pr-4 font-medium">Bed Type</th>
                <th className="pb-2 pr-4 font-medium">Inventory</th>
                <th className="pb-2 pr-4 font-medium">Size</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {r.name}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {r.hotel?.name}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{r.maxGuests}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{r.bedType}</td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {r.inventoryCount}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {r.sizeM2 ? `${r.sizeM2} m\u00B2` : "-"}
                  </td>
                  <td className="py-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(r.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
