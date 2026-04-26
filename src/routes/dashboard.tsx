import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — JobBoard Admin" }] }),
  component: DashboardShell,
});

function DashboardShell() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) return null;
  return <DashboardLayout />;
}
