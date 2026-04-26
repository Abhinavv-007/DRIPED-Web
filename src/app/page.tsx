"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import HomePage from "@/components/dashboard/home-page";

export default function RootPage() {
  return (
    <DashboardLayout>
      <HomePage />
    </DashboardLayout>
  );
}
