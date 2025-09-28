"use client";
import { useBootstrapAuth } from "@/hooks/useBootstrapAuth";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useBootstrapAuth();
  return <>{children}</>;
}
