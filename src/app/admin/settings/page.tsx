"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Receipt,
  Mail,
  HardDrive,
  Shield,
  Globe,
} from "lucide-react";

const configSections = [
  {
    title: "Payment Gateway",
    icon: CreditCard,
    color: "text-sky-600 bg-sky-100",
    items: [
      { label: "Stripe", description: "Primary payment processor for credit/debit cards", status: "ACTIVE" },
      { label: "Crypto Payments", description: "Cryptocurrency payment support (Bitcoin, Ethereum)", status: "DRAFT" },
    ],
  },
  {
    title: "Tax Configuration",
    icon: Receipt,
    color: "text-yellow-600 bg-yellow-100",
    items: [
      { label: "GST (Goods & Services Tax)", description: "12% applied to all bookings", value: "12%" },
      { label: "Green Tax", description: "$6 per person per night (Maldives government)", value: "$6.00 / person / night" },
    ],
  },
  {
    title: "Email Service",
    icon: Mail,
    color: "text-purple-600 bg-purple-100",
    items: [
      { label: "Provider", description: "Resend for transactional email delivery", value: "Resend" },
      { label: "Booking Confirmation", description: "Sent automatically when a reservation is confirmed", status: "ACTIVE" },
      { label: "Cancellation Notice", description: "Sent when a reservation is cancelled", status: "ACTIVE" },
    ],
  },
  {
    title: "Storage (S3)",
    icon: HardDrive,
    color: "text-teal-600 bg-teal-100",
    items: [
      { label: "Provider", description: "AWS S3 for photo and asset storage", value: "Amazon S3" },
      { label: "Max File Size", description: "Maximum upload size per file", value: "10 MB" },
      { label: "Allowed Formats", description: "Supported image formats for uploads", value: "JPEG, PNG, WebP, AVIF" },
    ],
  },
  {
    title: "Security",
    icon: Shield,
    color: "text-red-600 bg-red-100",
    items: [
      { label: "Authentication", description: "Session-based auth with role-based access control", status: "ACTIVE" },
      { label: "Roles", description: "SUPER_ADMIN, ADMIN, STAFF, GUEST", value: "4 roles" },
      { label: "Audit Logging", description: "All admin actions are logged for compliance", status: "ACTIVE" },
    ],
  },
  {
    title: "Regional",
    icon: Globe,
    color: "text-indigo-600 bg-indigo-100",
    items: [
      { label: "Default Currency", description: "Primary display and booking currency", value: "USD" },
      { label: "Timezone", description: "Maldives Time (MVT)", value: "UTC+5 (Indian/Maldives)" },
      { label: "Default Language", description: "Primary interface language", value: "English" },
    ],
  },
];

export default function AdminSettingsPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">
          System configuration reference &mdash; contact a developer to modify
          these values
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {configSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.color}`}
                >
                  <section.icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {section.title}
                </h2>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {item.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {"status" in item && item.status ? (
                        <Badge status={item.status} />
                      ) : "value" in item && item.value ? (
                        <span className="text-sm font-medium text-slate-700">
                          {item.value}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
