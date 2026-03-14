import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Join NattuFeed to connect with your neighborhood and stay updated with real-time local news.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
