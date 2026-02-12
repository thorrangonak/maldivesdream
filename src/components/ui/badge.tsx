import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-100 text-slate-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  DRAFT: "bg-slate-100 text-slate-600",
  INACTIVE: "bg-red-100 text-red-800",
};

export function Badge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusColors[status] || "bg-slate-100 text-slate-800",
        className
      )}
    >
      {status}
    </span>
  );
}
