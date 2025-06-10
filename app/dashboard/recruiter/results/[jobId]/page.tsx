"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, CheckCircle, Clock, X,
  Briefcase, Code, Award
} from "lucide-react";

/* helper colors identical to the mock version … */
const scoreColor = (s: number) =>
  s >= 90 ? "text-green-400" :
  s >= 80 ? "text-yellow-400" :
  s >= 70 ? "text-orange-400" :
            "text-red-400";

const statusColor = (st: string) => ({
  shortlisted: "bg-green-500/20 text-green-400 border-green-400/30",
  waitlisted : "bg-yellow-500/20 text-yellow-400 border-yellow-400/30",
  declined   : "bg-red-500/20  text-red-400  border-red-400/30",
  pending    : "bg-blue-500/20 text-blue-400 border-blue-400/30"
}[st as keyof typeof statusColor] ?? "bg-blue-500/20 text-blue-400 border-blue-400/30");

/* ──────────────────────────────────────────────────────────────── */

type Ranking = Database["public"]["Tables"]["resume_rankings"]["Row"];
type Analysis = Database["public"]["Tables"]["resume_analysis"]["Row"];

export default function ResultsPage({ params }: { params: { jobId: string } }) {
  const supabase = createClientComponentClient<Database>();
  const router   = useRouter();

  const [rows,        setRows]        = useState<(Ranking & Partial<Analysis>)[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  /* 1 ▸ pull data ----------------------------------------------------------*/
  useEffect(() => {
    (async () => {
      /* rankings first */
      const { data: rankings, error } = await supabase
        .from("resume_rankings")
        .select("resume_id,total_score,rank,status,candidate_name")
        .eq("job_id", params.jobId)
        .order("rank", { ascending: true });

      if (error || !rankings?.length) return console.error(error);

      /* analyses in bulk */
      const ids = rankings.map(r => r.resume_id);
      const { data: analyses } = await supabase
        .from("resume_analysis")
        .select("resume_id,key_skills,relevant_projects,certifications_courses,projects_relevance_score,experience_relevance_score")
        .in("resume_id", ids);

      const map = Object.fromEntries((analyses ?? []).map(a => [a.resume_id, a]));

      setRows(rankings.map(r => ({ ...r, ...map[r.resume_id] })));
    })();
  }, [params.jobId, supabase]);

  const selected = rows[selectedIdx];

  // 👇 NEW: Safe helper for screening title
  function getScreeningTitle(rows: any[]) {
    if (
      rows.length &&
      typeof rows[0].candidate_name === "string" &&
      rows[0].candidate_name.trim().length > 0
    ) {
      return (
        rows[0].candidate_name.split(" ").slice(-1)[0] + " Screening"
      );
    }
    return "Screening";
  }

  /* 2 ▸ status update helper ---------------------------------------------*/
  async function updateStatus(newStatus: string) {
    const row = rows[selectedIdx];
    setRows(rows => rows.map((r, i) => i === selectedIdx ? { ...r, status: newStatus } : r));
    await supabase
      .from("resume_rankings")
      .update({ status: newStatus })
      .eq("resume_id", row.resume_id)
      .eq("job_id", params.jobId);
  }

  /* while loading ---------------------------------------------------------*/
  if (!rows.length)
    return (
      <div className="min-h-screen flex items-center justify-center text-white/60">
        Loading results…
      </div>
    );

  /* ───────── identical UI – data wired to "rows" instead of mock ─────────*/
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <GlassButton onClick={() => router.back()} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </GlassButton>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {getScreeningTitle(rows)}
            </h1>
            <p className="text-white/60">{rows.length} candidates analysed</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* list */}
        <div className="lg:col-span-2 space-y-3">
          {rows.map((c, i) => (
            <GlassCard
              key={c.resume_id}
              className={`p-4 cursor-pointer transition-all ${i === selectedIdx
                ? "border-blue-400/50 bg-blue-500/10"
                : "hover:bg-white/5"}`}
              onClick={() => setSelectedIdx(i)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    #{c.rank}
                  </div>
                  <p className="font-medium text-white">{c.candidate_name}</p>
                </div>
                <div className={`text-lg font-bold ${scoreColor(c.total_score)}`}>
                  {Math.round(c.total_score)}%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge className={`text-xs ${statusColor(c.status)}`}>{c.status}</Badge>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* details */}
        <div className="lg:col-span-3 space-y-6">
          {/* top card */}
          <GlassCard className="p-6">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{selected.candidate_name}</h3>
              <div className={`text-3xl font-bold ${scoreColor(selected.total_score)}`}>
                {Math.round(selected.total_score)}%
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <GlassButton
                onClick={() => updateStatus("shortlisted")}
                className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 border-green-400/30"
                disabled={selected.status === "shortlisted"}
              >
                <CheckCircle className="w-4 h-4" />
                <span>Shortlist</span>
              </GlassButton>
              <GlassButton
                onClick={() => updateStatus("waitlisted")}
                className="flex items-center space-x-2 bg-yellow-500/20 hover:bg-yellow-500/30 border-yellow-400/30"
                disabled={selected.status === "waitlisted"}
              >
                <Clock className="w-4 h-4" />
                <span>Waitlist</span>
              </GlassButton>
              <GlassButton
                onClick={() => updateStatus("declined")}
                className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border-red-400/30"
                disabled={selected.status === "declined"}
              >
                <X className="w-4 h-4" />
                <span>Decline</span>
              </GlassButton>
            </div>
          </GlassCard>

          {/* score breakdown */}
          <GlassCard className="p-6 space-y-6">
            <h4 className="text-lg font-semibold text-white">Score Breakdown</h4>

            <Breakdown
              icon={Briefcase} label="Experience"
              score={selected.experience_relevance_score ?? 0}
            />
            <Breakdown
              icon={Code} label="Projects"
              score={selected.projects_relevance_score ?? 0}
            />
            <Breakdown
              icon={Award} label="Certifications"
              score={selected.certifications_courses ? 78 : 0}
            />
          </GlassCard>

          {/* skills */}
          <GlassCard className="p-6 space-y-6">
            <h4 className="text-lg font-semibold text-white">Skills & Experience</h4>

            <div>
              <p className="text-sm font-medium text-white/80 mb-2">Technical Skills</p>
              <div className="flex flex-wrap gap-2">
                {String(selected.key_skills || "")
                  .split(",")
                  .filter(Boolean)
                  .map((s: string) => (
                    <Badge key={s} className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                      {s.trim()}
                    </Badge>
                  ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

/* small helper component to keep JSX tidy */
function Breakdown({
  icon: Icon,
  label,
  score
}: { icon: any; label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className="w-4 h-4 text-blue-400" />
          <span className="text-white/80">{label}</span>
        </div>
        <span className="text-white font-medium">{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
}
