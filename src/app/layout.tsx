import React from "react";
import type { Metadata } from "next";
import { APP_NAME } from "../constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Pet-first social feed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
