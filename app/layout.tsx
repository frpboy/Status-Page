import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zerpai System Infrastructure Status",
  description: "Real-time health monitoring, operational status, and system metrics for Zerpai Cloud Infrastructure (AWS CloudFront, ECS, RDS, EC2, Cognito). Hosted independently on Vercel Edge.",
  keywords: ["Zerpai", "AWS Status", "CloudFront", "ECS", "RDS PostgreSQL", "Vercel Status Page"],
  openGraph: {
    title: "Zerpai System Infrastructure Status",
    description: "Live operational status & uptime monitoring for Zerpai ERP Infrastructure.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
