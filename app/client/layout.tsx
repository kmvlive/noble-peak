import { ClientLayoutClient } from "@/components/client-layout-client";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayoutClient>{children}</ClientLayoutClient>;
}
