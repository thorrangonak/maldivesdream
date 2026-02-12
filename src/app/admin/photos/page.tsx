"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Hotel {
  id: string;
  name: string;
}

interface RoomType {
  id: string;
  name: string;
  hotel: { id: string; name: string };
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function AdminPhotosPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetType, setTargetType] = useState<"hotel" | "roomType">("hotel");
  const [hotelId, setHotelId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [altText, setAltText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [hotelRes, roomRes] = await Promise.all([
        fetch("/api/admin/hotels?pageSize=100"),
        fetch("/api/admin/room-types?pageSize=100"),
      ]);
      const hotelJson = await hotelRes.json();
      const roomJson = await roomRes.json();
      const h = hotelJson.data?.hotels || [];
      const r = roomJson.data?.roomTypes || [];
      setHotels(h);
      setRoomTypes(r);
      if (h.length > 0 && !hotelId) setHotelId(h[0].id);
      if (r.length > 0 && !roomTypeId) setRoomTypeId(r[0].id);
    } catch {
      setError("Failed to load hotels and room types");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("File type not supported. Use JPEG, PNG, WebP, or AVIF.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("File exceeds 10MB limit.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      // Step 1: Get presigned URL
      const payload: Record<string, string | number> = {
        filename: selectedFile.name,
        mimeType: selectedFile.type,
        sizeBytes: selectedFile.size,
      };
      if (altText) payload.altText = altText;

      if (targetType === "hotel") {
        payload.hotelId = hotelId;
      } else {
        payload.roomTypeId = roomTypeId;
      }

      const presignRes = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!presignRes.ok) {
        const json = await presignRes.json();
        throw new Error(json.error || "Failed to get upload URL");
      }

      const { data } = await presignRes.json();
      const { uploadUrl } = data;

      // Step 2: Upload file to presigned URL
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setSuccess(`Photo "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      setAltText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Photos</h1>
          <p className="text-slate-500">
            Upload photos for hotels and room types
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-center text-sm text-slate-500">Loading...</p>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Upload Photo</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Target selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Upload for
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="targetType"
                      value="hotel"
                      checked={targetType === "hotel"}
                      onChange={() => setTargetType("hotel")}
                      className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Hotel
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="targetType"
                      value="roomType"
                      checked={targetType === "roomType"}
                      onChange={() => setTargetType("roomType")}
                      className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Room Type
                  </label>
                </div>
              </div>

              {/* Hotel / Room Type select */}
              <div className="grid gap-4 sm:grid-cols-2">
                {targetType === "hotel" ? (
                  <div className="space-y-1">
                    <label
                      htmlFor="photoHotel"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Hotel
                    </label>
                    <select
                      id="photoHotel"
                      value={hotelId}
                      onChange={(e) => setHotelId(e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="">Select hotel</option>
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label
                      htmlFor="photoRoomType"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Room Type
                    </label>
                    <select
                      id="photoRoomType"
                      value={roomTypeId}
                      onChange={(e) => setRoomTypeId(e.target.value)}
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
                )}

                <Input
                  label="Alt Text"
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Sunset view from overwater villa"
                />
              </div>

              {/* File input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Photo File
                </label>
                <div
                  className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 px-6 py-8 transition-colors hover:border-sky-400"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-8 w-8 text-sky-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          &mdash; {selectedFile.type}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">
                        Click to select a photo
                      </p>
                      <p className="text-xs text-slate-400">
                        JPEG, PNG, WebP, AVIF up to 10MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.avif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={uploading}
                  disabled={!selectedFile}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
