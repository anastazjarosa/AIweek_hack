"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SignIn() {
  const router = useRouter();
  const go = () => router.push("/onboarding");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-10">
        <Logo />
      </div>
      <Card className="w-full max-w-[420px] p-9">
        <h1 className="mb-2 text-3xl font-light tracking-[-0.02em]">Welcome back</h1>
        <p className="mb-8 text-muted">Pick up where you left off.</p>
        <Button variant="secondary" className="mb-6 w-full" onClick={go}>
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
            <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
            <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" />
          </svg>
          Continue with Google
        </Button>
        <div className="mb-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
          className="space-y-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">University email</span>
            <input
              type="email"
              defaultValue="maya.patel@student.ac.uk"
              className="h-12 w-full rounded-2xl border border-line bg-canvas px-4 outline-none transition-colors focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Password</span>
            <input
              type="password"
              defaultValue="demo-password"
              className="h-12 w-full rounded-2xl border border-line bg-canvas px-4 outline-none transition-colors focus:border-accent"
            />
          </label>
          <Button type="submit" size="lg" className="w-full">
            Sign in <ArrowRight />
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-sm text-muted">Demo only. Any details work.</p>
    </div>
  );
}
