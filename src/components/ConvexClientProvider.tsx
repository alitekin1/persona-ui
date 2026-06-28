"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// In Vercel, this will be set via Environment Variables
// For local, we create a .env.local in ui/
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://cheery-marmot-556.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}