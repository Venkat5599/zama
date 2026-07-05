import { DashboardSidebar } from "@/components/dashboard-sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:pl-60">
      <DashboardSidebar />
      <div className="max-md:pt-14">{children}</div>
    </div>
  );
}
