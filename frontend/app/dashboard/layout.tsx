import { DashboardHeader } from "@/components/dashboard-header";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  );
}
