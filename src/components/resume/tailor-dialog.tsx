'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { ResumeData } from '@/lib/resume-types';
import { MatchScoreDisplay } from '@/components/resume/match-score-display';
import type { MatchScore } from '@/components/resume/match-score-display';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TailorDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  section?: string;
}

export function TailorDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange, section }: TailorDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);
  const { resumeData, setResumeData } = useResumeStore();
  const { toast } = useToast();

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;

  const sectionLabels: Record<string, string> = {
    'personalInfo': 'Personal Information',
    'summary': 'Professional Summary',
    'certifications': 'Certifications',
    'skills': 'Technical Skills',
    'experience': 'Professional Experience',
    'education': 'Education',
    'projects': 'Projects',
  };

  const sectionLabel = section ? sectionLabels[section] || section : null;

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
          section: section || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to tailor resume');
      }

      const data = await response.json();

      if (data.tailoredResume) {
        setResumeData(data.tailoredResume as ResumeData);
      } else {
        // Fallback: if AI returned the resume directly without wrapper
        setResumeData(data as ResumeData);
      }

      // Show match score if available
      if (data.matchScore) {
        setMatchScore(data.matchScore);
      }

      // Close dialog only if no match score to show
      if (!data.matchScore) {
        setOpen(false);
        setJobDescription('');
        setAdditionalInstructions('');
      }

      toast({
        title: sectionLabel ? `${sectionLabel} Tailored` : 'Resume Tailored',
        description: sectionLabel
          ? `The ${sectionLabel} section has been optimized for the job description.`
          : 'Your resume has been tailored to match the job description.',
      });
    } catch (error) {
      console.error('Tailor error:', error);
      toast({
        title: 'Error',
        description: 'Failed to tailor resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Don't clear fields immediately so user can re-open if needed
  };

  const dialogContent = (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          {sectionLabel ? `AI Tailor: ${sectionLabel}` : 'AI Tailor Resume'}
        </DialogTitle>
        <DialogDescription>
          {sectionLabel
            ? `Paste the job description and the AI will optimize only the "${sectionLabel}" section.`
            : 'Paste a job description and the AI will tailor your entire resume to match.'}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
        {/* Step 1: Job Description */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold">1</div>
            <Label htmlFor="job-description" className="text-sm font-semibold">Job Description</Label>
          </div>
          <Textarea
            id="job-description"
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
                placeholder={`Give the AI specific guidance, e.g.:
• Focus on my 2nd experience at Optum
• Make bullet points more concise and impactful
• Highlight Python and SQL skills more
• Remove the Projects section
• Emphasize healthcare domain experience
• Keep the summary under 3 sentences
• Change job title to Data Engineer
• Add more technical details to experience
• Make all bullet points action-oriented`}
                rows={6}
                className="resize-y text-sm"
              />
              <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  These instructions apply to the ENTIRE resume. You can ask the AI to focus on certain sections, change writing style across all bullet points, adjust detail level, modify specific entries, or anything else you want. The AI will apply your instructions across all relevant sections — not just the summary.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleTailor}
          disabled={loading || !jobDescription.trim()}
          className="w-full sm:w-auto gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Tailoring Resume...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {sectionLabel ? `Tailor ${sectionLabel}` : 'Tailor & Score Resume'}
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );

  // If controlled (no DialogTrigger needed when parent controls open state)
  if (controlledOpen !== undefined) {
    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            {dialogContent}
          </DialogContent>
        </Dialog>
        {matchScore && (
          <MatchScoreDisplay score={matchScore} onClose={() => setMatchScore(null)} />
        )}
      </>
    );
  }

  // Uncontrolled mode with DialogTrigger (for toolbar / section buttons)
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Tailor
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          {dialogContent}
        </DialogContent>
      </Dialog>
      {matchScore && (
        <MatchScoreDisplay score={matchScore} onClose={() => setMatchScore(null)} />
      )}
    </>
  );
}
