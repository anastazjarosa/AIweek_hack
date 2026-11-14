"use client";

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deleteAllData, exportData, sentToAI, storedData, useConsent } from "@/lib/privacy";

const bandText = { "under-13": "under 13", "13-15": "13 to 15", "16-17": "16 or 17", "18-plus": "18 or over" } as const;

export default function PrivacyPage() {
  const consent = useConsent();
  const [confirm, setConfirm] = useState(false);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mosaic-my-data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppShell crumb="Privacy" showLayout={false}>
      <div className="max-w-3xl">
        <p className="mb-2 text-sm text-muted">Privacy</p>
        <h1 className="mb-3 text-4xl font-light tracking-[-0.02em]">Your data</h1>
        <p className="mb-8 text-ink/75">
          Mosaic is built for students, many under 18. It keeps as little as it can, keeps it on your device, and never
          diagnoses or labels anyone.
        </p>

        <Card className="mb-6 p-6">
          <h2 className="mb-3 text-lg font-medium">What&rsquo;s kept, and where</h2>
          <p className="mb-4 text-[15px] text-ink/80">Everything below is stored only in this browser. There is no Mosaic account or server copy.</p>
          <dl className="space-y-3">
            {storedData.map((d) => (
              <div key={d.key} className="rounded-2xl px-4 py-3 ring-1 ring-line">
                <dt className="font-mono text-xs text-muted">{d.key}</dt>
                <dd className="text-[15px]">{d.what}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="mb-3 text-lg font-medium">What goes to the AI</h2>
          <p className="mb-3 text-[15px] text-ink/80">
            The Simulation Lab uses Claude, made by Anthropic, to build experiments and give feedback. Only this text is sent:
          </p>
          <ul className="mb-3 list-disc space-y-1 pl-5 text-[15px]">
            {sentToAI.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <p className="text-[15px] text-ink/80">
            Your name, need scores, learning profile and plans are never sent. Every AI instruction includes a rule never to
            mention or guess at a medical condition. If live AI is off, nothing is sent at all.
          </p>
        </Card>

        <Card className="mb-6 p-6">
          <h2 className="mb-3 text-lg font-medium">Consent</h2>
          <p className="text-[15px] text-ink/80">
            {consent
              ? `You agreed on ${new Date(consent.at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}, age ${bandText[consent.ageBand]}${consent.guardian ? ", with a parent or guardian's agreement" : ""}.`
              : "You haven't agreed yet. You'll be asked when you open the app."}
          </p>
          <p className="mt-2 text-[15px] text-ink/80">
            Students under 18 need a parent or guardian to agree. In a school rollout this would be a signed form collected
            by the school; in this demo it is a confirmation box.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="mb-3 text-lg font-medium">Your choices</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={download}>
              <Download /> Download my data
            </Button>
            {!confirm ? (
              <Button variant="ghost" onClick={() => setConfirm(true)}>
                <Trash2 /> Delete all my data
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-clay-soft px-4 py-2" role="alert">
                <span className="text-[15px]">This deletes everything above from this browser. It can&rsquo;t be undone.</span>
                <Button size="sm" onClick={deleteAllData}>
                  Yes, delete it
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
