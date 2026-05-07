'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { ResumeData } from '@/lib/resume-types';
import { MatchScoreDisplay } from '@/components/resume/match-score-display';
import type { MatchScore } from '@/components/resume/match-score-display';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SectionTailorButtonProps {
  section: string;
  sectionLabel: string;
}

export function SectionTailorButton({ section, sectionLabel }: SectionTailorButtonProps) {
  const [open, setOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);
  const { resumeData, setResumeData } = useResumeStore();
  const { toast } = useToast();

  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Missing Job Description',
        description: 'Please paste a job description first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setMatchScore(null);
    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          jobDescription: jobDescription.trim(),
          additionalInstructions: additionalInstructions.trim(),
          section,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to tailor section');
      }

      const data = await response.json();

      if (data.tailoredResume) {
        setResumeData(data.tailoredResume as ResumeData);
      }

      if (data.matchScore) {
        setMatchScore(data.matchScore);
      }

      if (!data.matchScore) {
        setOpen(false);
        setJobDescription('');
        setAdditionalInstructions('');
      }

      toast({
        title: `${sectionLabel} Tailored`,
        description: `The ${sectionLabel} section has been optimized for the job description.`,
      });
    } catch (error) {
      console.error('Section tailor error:', error);
      toast({
        title: 'Error',
        description: 'Failed to tailor section. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
      >
        <Sparkles className="h-3 w-3" />
        AI Tailor
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Tailor: {sectionLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Step 1: Job Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold">1</div>
                <Label className="text-sm font-semibold">Job Description</Label>
              </div>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={8}
                className="resize-y text-sm"
              />
            </div>

            {/* Step 2: Additional Instructions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-2 w-full text-left"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold">2</div>
                <Label className="text-sm font-semibold cursor-pointer">Additional Instructions</Label>
                <span className="text-xs text-slate-400">(optional)</span>
                {showInstructions ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 ml-auto" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 ml-auto" />
                )}
              </button>

              {showInstructions && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Textarea
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder={`Specific guidance for ${sectionLabel}, e.g.:
• Make it more concise and impactful
• Highlight specific keywords from the JD
• Focus on the most recent experience
• Add more technical details and metrics
• Use stronger action verbs
• Reorder to put most relevant items first`}
                    rows={5}
                    className="resize-y text-sm"
                  />
                  <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>Only the {sectionLabel} section will be modified. All other sections stay the same.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleTailor} disabled={loading || !jobDescription.trim()} className="w-full sm:w-auto gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tailoring...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Tailor {sectionLabel}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {matchScore && (
        <MatchScoreDisplay score={matchScore} onClose={() => setMatchScore(null)} />
      )}
    </>
  );
}
