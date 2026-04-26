import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    navigate({ to: user ? "/dashboard" : "/login", replace: true });
  }, [user, loading, navigate]);
  return null;
}
