import { Suspense } from "react";
import { ConfirmationContent } from "./confirmation-content";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
