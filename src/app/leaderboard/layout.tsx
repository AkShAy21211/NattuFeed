import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See the top Nattukarans contributing to your neighborhood and track your local impact.",
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
