import type { Metadata } from "next";
import "./report.css";

export const metadata: Metadata = {
  title: "Knowing When to Respond — Pikaia Research",
  description:
    "Official companion technical report for Pikaia Interview EOU Benchmark v1.0.0: presenting the Pikaia-Turn detector family, controlled data × architecture ablations, open-weight interview fine-tuning, and external benchmark transfer.",
  metadataBase: new URL("https://github.com/Pikaia-AI/interview-eou-report"),
  icons: {
    icon: "/art/brand-mark.webp",
    shortcut: "/art/brand-mark.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
