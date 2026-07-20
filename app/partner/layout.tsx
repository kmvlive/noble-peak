import { PartnerLayoutClient } from "@/components/partner-layout-client";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnerLayoutClient>{children}</PartnerLayoutClient>;
}
