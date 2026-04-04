"use client";

import { createContext, useContext, ReactNode } from "react";
import type { DashboardData } from "@/lib/types";

const DataContext = createContext<DashboardData | null>(null);

export function DataProvider({
  data,
  children,
}: {
  data: DashboardData;
  children: ReactNode;
}) {
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
