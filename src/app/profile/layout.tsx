import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your NattuFeed profile, track your Karma points, and view your local contributions.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
