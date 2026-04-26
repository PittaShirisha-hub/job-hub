import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const credSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — JobBoard Admin" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid credentials";
      setError(msg);
      return;
    }
    setSubmitting(true);
    const { error: authError } =
      tab === "signin"
        ? await signIn(parsed.data.email, parsed.data.password)
        : await signUp(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (authError) {
      setError(authError);
      toast.error(authError);
      return;
    }
    toast.success(tab === "signin" ? "Signed in" : "Account created");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl">JobBoard Admin</CardTitle>
            <CardDescription>Sign in to manage job listings</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as "signin" | "signup"); setError(""); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="m-0" />
            <TabsContent value="signup" className="m-0" />
          </Tabs>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={tab === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={100} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait..." : tab === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
