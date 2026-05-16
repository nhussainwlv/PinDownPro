"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success("Account created! Signing you in…");
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error(result.error);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{mode === "signin" ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              {mode === "signin"
                ? "Sign in to save history, favorites, and unlock Pro features."
                : "Join Pin Down Pro for download history and premium tools."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              Continue with Google
            </Button>
            <div className="relative text-center text-xs text-zinc-500">
              <span className="bg-transparent px-2">or</span>
            </div>
            <form onSubmit={handleCredentials} className="space-y-3">
              {mode === "register" && (
                <Input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
            <button
              type="button"
              className="w-full text-center text-sm text-zinc-400 hover:text-white"
              onClick={() => setMode(mode === "signin" ? "register" : "signin")}
            >
              {mode === "signin" ? "Need an account? Register" : "Already have an account? Sign in"}
            </button>
            <Link href="/" className="block text-center text-sm text-rose-400 hover:underline">
              ← Back to home
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}
