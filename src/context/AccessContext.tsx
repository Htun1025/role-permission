"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { RolesClientProps } from "@/types";

type Access = RolesClientProps["access"];

const AccessContext = createContext<Access | null>(null);

type AccessProviderProps = {
  access: Access;
  children: ReactNode;
};

export function AccessProvider({ access, children }: AccessProviderProps) {
  return (
    <AccessContext.Provider value={access}>{children}</AccessContext.Provider>
  );
}

export function useAccess(): Access {
  const context = useContext(AccessContext);

  if (context === null) {
    throw new Error("useAccess must be used inside AccessProvider");
  }

  return context;
}
