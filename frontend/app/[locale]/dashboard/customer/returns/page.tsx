"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { ReturnList } from "@/components/returns/ReturnList";

export default function CustomerReturnsPage() {
  return (
    <AuthGuard allowedRoles={["customer", "staff", "admin"]}>
      <ReturnList />
    </AuthGuard>
  );
}
