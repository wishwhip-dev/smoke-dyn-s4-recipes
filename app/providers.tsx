"use client";

import { Toaster } from "sonner";
import { HomeScreen } from "@/components/home-screen";
import { VisitBeacon } from "@/components/visit-beacon";

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}<Toaster richColors position="top-right" /><HomeScreen /><VisitBeacon /></>;
}
