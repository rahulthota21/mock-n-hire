/* app/dashboard/recruiter/components/new-screening-modal.tsx */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassInput } from "@/components/ui/glass-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import {
  Upload,
  File,
  X,
  Briefcase,
  Award,
  Code,
} from "lucide-react";

/* -------------------------------------------------------------------------- */

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewScreeningModal({ open, onClose }: Props) {
  /* ─────────── Supabase ─────────── */
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  /* ─────────── local state ───────── */
  const [form, setForm] = useState({
    title: "",
    description: "",
    exp: [30],
    proj: [25],
    cert: [20],
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /* ─────────── drop-zone ─────────── */
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".zip")) {
      toast.error("Only .zip files are supported");
      return;
    }
    setFile(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/zip": [".zip"] },
  });

  const removeFile = () => setFile(null);

  /* ─────────── submit ────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !file) {
      toast.error("Fill required fields and attach a ZIP");
      return;
    }
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("job_title", form.title);
      formData.append("job_description", form.description);
      formData.append("weight_experience", form.exp[0].toString());
      formData.append("weight_projects", form.proj[0].toString());
      formData.append("weight_certifications", form.cert[0].toString());

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      console.log("Access token for upload:", token); // For debugging
      if (!token) {
        toast.error("Please login again (no token)");
        setLoading(false);
        return;
      }

      const res = await fetch("http://localhost:4000/upload-resumes/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`HTTP ${res.status}: ${detail}`);
      }

      const { job_id } = await res.json();
      router.push(`/dashboard/recruiter/animation?job=${job_id}`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed – check console");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── ui ─────────────────── */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-transparent border-none p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <GlassCard className="p-8" hover={false}>
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                Create New Screening
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* basic info */}
              <div className="space-y-4">
                <GlassInput
                  label="Job Title *"
                  placeholder="e.g. Senior Frontend Developer"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">
                    Job Description
                  </label>
                  <textarea
                    className="glass-input w-full h-32 resize-none"
                    placeholder="Describe the role…"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* weights */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Scoring Weights
                </h3>
                <p className="text-sm text-white/60">
                  Adjust how much each factor contributes to the overall score
                </p>

                <WeightRow
                  icon={<Briefcase className="w-4 h-4 text-blue-400" />}
                  label="Experience"
                  state={form.exp}
                  onChange={(v) => setForm({ ...form, exp: v })}
                />
                <WeightRow
                  icon={<Code className="w-4 h-4 text-green-400" />}
                  label="Projects"
                  state={form.proj}
                  onChange={(v) => setForm({ ...form, proj: v })}
                />
                <WeightRow
                  icon={<Award className="w-4 h-4 text-purple-400" />}
                  label="Certifications"
                  state={form.cert}
                  onChange={(v) => setForm({ ...form, cert: v })}
                />
              </div>

              {/* upload */}
              <UploadZone
                {...{
                  getRootProps,
                  getInputProps,
                  isDragActive,
                  file,
                  removeFile,
                }}
              />

              {/* actions */}
              <div className="flex justify-end gap-4 pt-6">
                <GlassButton type="button" variant="outline" onClick={onClose}>
                  Cancel
                </GlassButton>
                <GlassButton type="submit" variant="primary" loading={loading}>
                  Start Screening
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* helpers                                                                    */
/* -------------------------------------------------------------------------- */

const WeightRow = ({
  icon,
  label,
  state,
  onChange,
}: {
  icon: JSX.Element;
  label: string;
  state: number[];
  onChange: (v: number[]) => void;
}) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-white/80">{label}</span>
      </div>
      <span className="text-white font-medium">{state[0]}%</span>
    </div>
    <Slider value={state} onValueChange={onChange} max={50} step={5} />
  </div>
);

const UploadZone = ({
  getRootProps,
  getInputProps,
  isDragActive,
  file,
  removeFile,
}: any) => (
  <div className="space-y-4">
    <label className="block text-sm font-medium text-white/80">
      Upload Resumes *
    </label>

    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
        isDragActive
          ? "border-blue-400/50 bg-blue-500/10"
          : "border-white/20 hover:border-white/30"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-white/40" />
      <p className="text-white/80 mb-2">
        {isDragActive ? "Drop file here…" : "Drag & drop ZIP here"}
      </p>
      <p className="text-sm text-white/60">Only ZIP archives are accepted</p>
    </div>

    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <motion.div
            key={file.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-white">{file.name}</p>
                <p className="text-xs text-white/60">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-8 w-8 p-0 hover:bg-red-500/20"
            >
              <X className="w-4 h-4 text-red-400" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
