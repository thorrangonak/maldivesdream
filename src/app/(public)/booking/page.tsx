import { Suspense } from "react";
import BookingForm from "./booking-form";

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading booking...</div>}>
      <BookingForm />
    </Suspense>
  );
}
