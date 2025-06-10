"use client";

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus, FileText, Clock, CheckCircle, Eye, Users, TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NewScreeningModal } from "./components/new-screening-modal";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

type Row = {
  job_id   : string;
  job_title: string;
  created_at: string;
};

type Stat = { completed: number; total: number; };

async function fetchSummary() {
  const supabase = createClientComponentClient<Database>();

  /* this RPC isn't deployed in your Supabase yet – call defensively */
  // const { data, error } = await supabase.rpc("count_screenings_summary");

  // if (error && (error as any).code === "PGRST116") return []; // 116 = function not found
  // if (error) throw error;
  // return data;
  return { completed: 0, total: 0 }; // Temporary fallback
}

export default function RecruiterDashboard() {
  const { showNewScreeningModal, setShowNewScreeningModal } = useAppStore();
  const router = useRouter();

  const [list, setList] = useState<Row[]>([]);
  const [stat, setStat] = useState<Stat>({ completed: 0, total: 0 });

  /* fetch screenings + simple stats */
  useEffect(() => { (async () => {
    /* job rows */
    const { data: jobs } = await supabase
      .from("job_descriptions")
      .select("job_id,job_title,created_at")
      .order("created_at",{ ascending:false });

    setList(jobs as Row[]);

    /* quick aggregate for cards (optional) */
    try {
      const agg = await fetchSummary();
      if (agg) setStat(agg as Stat);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setStat({ completed: 0, total: 0 });
    }
  })(); }, []);

  /* ui helpers */
  const color = (s: string) =>
    s === "completed" ? "text-green-400 bg-green-500/10"
    : s === "in-progress" ? "text-yellow-400 bg-yellow-500/10"
    : "text-gray-400 bg-gray-500/10";
  const icon = (s: string) =>
    s === "completed" ? <CheckCircle className="w-4 h-4" />
    : s === "in-progress" ? <Clock className="w-4 h-4" />
    : <FileText className="w-4 h-4" />;

  return (
    <>
      <div className="container mx-auto px-4 py-8 pt-24 space-y-8">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Recruiter Dashboard</h1>
          <p className="text-white/60">Manage your AI-powered screening campaigns</p>
        </motion.div>

        {/* quick stats */}
        <StatsCard stat={stat} />

        {/* new screening cta */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .15 }}>
          <GlassCard className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r
                from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Plus className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Start New Screening</h3>
            <p className="text-white/60 max-w-md mx-auto">
              Upload resumes and let our AI analyze and rank candidates
            </p>
            <GlassButton variant="primary"
              onClick={() => setShowNewScreeningModal(true)}
              className="inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /><span>Create New Screening</span>
            </GlassButton>
          </GlassCard>
        </motion.div>

        {/* recent screenings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .25 }} className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Recent Screenings</h2>
          <div className="grid gap-4">
            {list.map((j,i) => (
              <motion.div key={j.job_id} initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 + i * .05 }}>
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">{j.job_title}</h3>
                      <p className="text-sm text-white/60">
                        Created: {new Date(j.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <GlassButton size="sm" onClick={() =>
                      router.push(`/dashboard/recruiter/results/${j.job_id}`)}
                      className="flex items-center gap-1">
                      <Eye className="w-4 h-4" /><span>View</span>
                    </GlassButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <NewScreeningModal
        open={showNewScreeningModal}
        onClose={() => setShowNewScreeningModal(false)}
      />
    </>
  );
}

/* quick stat cards */
const StatsCard = ({ stat }: { stat: any }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: .1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-blue-500/20">
          <FileText className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{stat.total ?? "--"}</p>
          <p className="text-white/60">Total Screenings</p>
        </div>
      </div>
    </GlassCard>

    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-green-500/20">
          <Users className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{/* could calc */}--</p>
          <p className="text-white/60">Candidates Screened</p>
        </div>
      </div>
    </GlassCard>

    <GlassCard className="p-6" hover={false}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-purple-500/20">
          <TrendingUp className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{stat.completed ?? "--"}</p>
          <p className="text-white/60">Completed Screenings</p>
        </div>
      </div>
    </GlassCard>
  </motion.div>
);
