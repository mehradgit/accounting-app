// src/app/layout.js
"use client";

import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.rtl.min.css";
import "./globals.css";
import "@styles/persian-datepicker.css";
import NewHeader from "@/components/forms/layout/NewHeader";
import BootstrapClient from "@/components/BootstrapClient";

export default function RootLayout({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // در ابتدا placeholder نشان بده
  if (!mounted) {
    return (
      <html lang="fa" dir="rtl">
        <body>
          <div
            style={{
              height: "64px",
              backgroundColor: "#1a1a2e",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1300,
            }}
          />
          <main style={{ marginTop: "64px", padding: "20px" }}>
            {children}
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="app-container">
          <NewHeader />
          <main className="content" style={{ marginTop: "64px", padding: "20px" }}>
            {children}
          </main>
        </div>
        <BootstrapClient />
      </body>
    </html>
  );
}