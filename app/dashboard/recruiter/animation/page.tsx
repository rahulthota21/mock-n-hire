"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";

/* ──────────────────────────────────────────────────────────────── */

const LABELS = ["Uploading", "Parsing", "AI Analysis", "Ranking", "Complete"];

export default function Animation() {
  const qs     = useSearchParams();
  const jobId  = qs.get("job");             // comes from ?job=<uuid>
  const router = useRouter();

  const [pct , setPct ] = useState(0);      // progress %
  const [step, setStep] = useState(0);      // 0-4

  const tries   = useRef(0);
  const timer   = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;

    timer.current = setInterval(async () => {
      tries.current += 1;

      setPct(p => Math.min(p + 3, 95));
      setStep(s => (pct > 80 ? Math.min(s + 1, 3) : s));

      try {
        const res = await fetch(`http://localhost:4000/status?job_id=${jobId}`);
        const { status } = await res.json();

        if (status === "COMPLETE") {
          if (timer.current) clearInterval(timer.current);
          setPct(100);
          setStep(4);
          setTimeout(() => {
            router.push(`/dashboard/recruiter/results?job=${jobId}`);
          }, 600); // quick finish animation
          return;
        }
      } catch {
        // ignore network hiccup
      }

      if (tries.current >= 30) {
        if (timer.current) clearInterval(timer.current);
        router.back();
      }
    }, 5000);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line
  }, [jobId, router, pct]);

  /* ───────── UI (intact theme) ──────────────────────────────── */
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: .92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center space-y-8" hover={false}>
          <div className="space-y-2">
            <div className="w-16 h-16 mx-auto rounded-xl bg-blue-500/10 flex
                            items-center justify-center">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Processing Resumes</h1>
            <p className="text-white/60 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4" />
              Step {step + 1}/5 – {LABELS[step]}
            </p>
          </div>

          <Progress value={pct} className="h-2" />
          <p className="text-sm text-white/50">{pct}%</p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
