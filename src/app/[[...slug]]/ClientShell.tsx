"use client";

import dynamic from "next/dynamic";

const ClientApp = dynamic(() => import("@/App"), { ssr: false });

export default function ClientShell() {
  return <ClientApp />;
}
