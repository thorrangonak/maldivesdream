"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Pencil,
  Trash2,
  Building,
  X,
  RefreshCw,
} from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  island: string;
  atoll: string;
  description: string;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  contactEmail: string;
  contactPhone: string;
  starRating: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  _count?: { roomTypes: number; reservations: number };
}

const emptyForm = {
  name: "",
  island: "",
  atoll: "",
  description: "",
  amenities: "",
  checkInTime: "14:00",
  checkOutTime: "12:00",
  contactEmail: "",
  contactPhone: "",
  starRating: 5,
  status: "DRAFT" as "DRAFT" | "ACTIVE" | "INACTIVE",
};

export default function AdminHotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hotels?pageSize=100");
      const json = await res.json();
      setHotels(json.data?.hotels || []);
    } catch {
      setError("Failed to load hotels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };

  const openEdit = async (id: string) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/hotels/${id}`);
      const json = await res.json();
      const h = json.data;
      setEditingId(id);
      setForm({
        name: h.name || "",
        island: h.island || "",
        atoll: h.atoll || "",
        description: h.description || "",
        amenities: Array.isArray(h.amenities) ? h.amenities.join(", ") : "",
        checkInTime: h.checkInTime || "14:00",
        checkOutTime: h.checkOutTime || "12:00",
        contactEmail: h.contactEmail || "",
        contactPhone: h.contactPhone || "",
        starRating: h.starRating || 5,
        status: h.status || "DRAFT",
      });
      setShowForm(true);
    } catch {
      setError("Failed to load hotel details");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      amenities: form.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      starRating: Number(form.starRating),
    };

    try {
      const url = editingId
        ? `/api/admin/hotels/${editingId}`
        : "/api/admin/hotels";
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
      fetchHotels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;
    try {
      const res = await fetch(`/api/admin/hotels/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Delete failed");
      }
      fetchHotels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotels</h1>
          <p className="text-slate-500">Manage resort properties</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchHotels}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Hotel
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingId ? "Edit Hotel" : "Create Hotel"}
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                label="Island"
                id="island"
                value={form.island}
                onChange={(e) => setForm({ ...form, island: e.target.value })}
                required
              />
              <Input
                label="Atoll"
                id="atoll"
                value={form.atoll}
                onChange={(e) => setForm({ ...form, atoll: e.target.value })}
                required
              />
              <div className="space-y-1">
                <label
                  htmlFor="starRating"
                  className="block text-sm font-medium text-slate-700"
                >
                  Star Rating
                </label>
                <select
                  id="starRating"
                  value={form.starRating}
                  onChange={(e) =>
                    setForm({ ...form, starRating: Number(e.target.value) })
                  }
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} Star{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
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
                label="Amenities (comma-separated)"
                id="amenities"
                value={form.amenities}
                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                placeholder="Pool, Spa, Restaurant, Diving"
              />
              <div className="space-y-1">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "DRAFT" | "ACTIVE" | "INACTIVE",
                    })
                  }
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <Input
                label="Check-in Time"
                id="checkInTime"
                value={form.checkInTime}
                onChange={(e) =>
                  setForm({ ...form, checkInTime: e.target.value })
                }
                placeholder="14:00"
              />
              <Input
                label="Check-out Time"
                id="checkOutTime"
                value={form.checkOutTime}
                onChange={(e) =>
                  setForm({ ...form, checkOutTime: e.target.value })
                }
                placeholder="12:00"
              />
              <Input
                label="Contact Email"
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) =>
                  setForm({ ...form, contactEmail: e.target.value })
                }
              />
              <Input
                label="Contact Phone"
                id="contactPhone"
                value={form.contactPhone}
                onChange={(e) =>
                  setForm({ ...form, contactPhone: e.target.value })
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
                  {editingId ? "Update Hotel" : "Create Hotel"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Hotel list */}
      {loading ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          Loading hotels...
        </p>
      ) : hotels.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center py-12">
            <Building className="h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No hotels found</p>
            <Button size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first hotel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Island</th>
                <th className="pb-2 pr-4 font-medium">Atoll</th>
                <th className="pb-2 pr-4 font-medium">Stars</th>
                <th className="pb-2 pr-4 font-medium">Rooms</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotels.map((h) => (
                <tr key={h.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-900">
                    {h.name}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">{h.island}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{h.atoll}</td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {"★".repeat(h.starRating)}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-600">
                    {h._count?.roomTypes ?? 0}
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge status={h.status} />
                  </td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(h.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(h.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
