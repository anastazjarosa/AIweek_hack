"use client";

import { MotionConfig } from "framer-motion";
import { useProfile } from "@/lib/profile";

export function Providers({ children }: { children: React.ReactNode }) {
  const { prefs } = useProfile();
  return (
    <MotionConfig reducedMotion={prefs.calmTheme ? "always" : "user"}>
      <div data-calm={prefs.calmTheme || undefined} className="contents">
        {children}
      </div>
    </MotionConfig>
  );
}
