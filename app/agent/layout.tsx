import { AgentLayoutClient } from "@/components/agent-layout-client";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgentLayoutClient>{children}</AgentLayoutClient>;
}
