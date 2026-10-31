"use client";

import { AdminDashboardDemoApp } from "../admin-dashboard-demo-app";

export function HomeAdminDashboardDemo({ label }: { label?: string }) {
  if (label) {
    return <AdminDashboardDemoApp label={label} />;
  }
  return <AdminDashboardDemoApp />;
}
