"use client";
import { useBootstrapAuth } from "@/hooks/useBootstrapAuth";
import { createContext, useContext } from "react";

type BootstrapContextType = {
  isBootstrapping: boolean;
};

const BootstrapContext = createContext<BootstrapContextType>({
  isBootstrapping: true,
});

export const useBootstrapContext = () => useContext(BootstrapContext);

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isBootstrapping } = useBootstrapAuth();

  return (
    <BootstrapContext.Provider value={{ isBootstrapping }}>
      {children}
    </BootstrapContext.Provider>
  );
}
