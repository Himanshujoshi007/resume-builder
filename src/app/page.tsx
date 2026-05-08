'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { ResumeData } from '@/lib/resume-types';
import { generateResumePDF } from '@/lib/pdf-generator';
import { PersonalInfoForm } from '@/components/resume/personal-info-form';
import { SummaryForm } from '@/components/resume/summary-form';
import { CertificationsForm } from '@/components/resume/certifications-form';
import { SkillsForm } from '@/components/resume/skills-form';
import { ExperienceForm } from '@/components/resume/experience-form';
import { EducationForm } from '@/components/resume/education-form';
import { ProjectsForm } from '@/components/resume/projects-form';
import { ResumePreview } from '@/components/resume/resume-preview';
import { MatchScoreDisplay } from '@/components/resume/match-score-display';
import type { MatchScore } from '@/components/resume/match-score-display';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileDown,
  RotateCcw,
  Loader2,
  FileText,
  Eye,
  ClipboardPaste,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { resumeData, resetResume, setResumeData } = useResumeStore();
  const [downloading, setDownloading] = useState(false);

  // Paste state
  const [resumeText, setResumeText] = useState('');
  const [parsing, setParsing] = useState(false);

  // AI Tailor state
  const [jobDescription, setJobDescription] = useState('');
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);

  // Flow state: false = paste screen, true = editor
  const [hasResume, setHasResume] = useState(false);

  const { toast } = useToast();

  // ─── Parse pasted resume ──────────────────────────────────
  const handleParse = async () => {
    if (!resumeText.trim()) {
      toast({ title: 'Empty Resume', description: 'Please paste your resume text first.', variant: 'destructive' });
      return;
    }
    setParsing(true);
    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumeText.trim() }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to parse resume';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } else {
            errorMsg = `Server error (${response.status}). Please try again.`;
          }
        } catch {
          errorMsg = `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setResumeData(data.resumeData as ResumeData);
      setResumeText('');
      setHasResume(true);
      toast({ title: 'Resume Parsed', description: 'Your resume has been structured successfully. You can now edit and tailor it.' });
    } catch (error) {
      console.error('Parse error:', error);
      toast({ title: 'Parse Failed', description: error instanceof Error ? error.message : 'Failed to parse resume.', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  };

  // ─── AI Tailor handler ─────────────────────────────────────
  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      toast({ title: 'Missing Job Description', description: 'Please paste a job description first.', variant: 'destructive' });
      return;
    }
    setTailoring(true);
    setMatchScore(null);
    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData,
          jobDescription: jobDescription.trim(),
          additionalInstructions: personalInstructions.trim(),
        }),
      });
      if (!response.ok) {
        let errorMsg = 'Failed to tailor resume';
        try {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
          } else {
            errorMsg = `Server error (${response.status}). Please try again.`;
          }
        } catch {
          errorMsg = `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      if (data.tailoredResume) {
        setResumeData(data.tailoredResume as ResumeData);
      }
      if (data.matchScore) {
        setMatchScore(data.matchScore);
      }
      toast({ title: 'Resume Tailored', description: 'Your resume has been optimized for the job description.' });
    } catch (error) {
      console.error('Tailor error:', error);
      toast({ title: 'Error', description: 'Failed to tailor resume. Please try again.', variant: 'destructive' });
    } finally {
      setTailoring(false);
    }
  };

  // ─── PDF Download (client-side) ────────────────────────────
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      generateResumePDF(resumeData);
      toast({ title: 'PDF Downloaded', description: 'Your resume has been downloaded.' });
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    resetResume();
    setHasResume(false);
    setResumeText('');
    setJobDescription('');
    setPersonalInstructions('');
    setMatchScore(null);
    toast({ title: 'Reset', description: 'Resume has been reset.' });
  };

  // ─── PASTE SCREEN ─────────────────────────────────────────
  if (!hasResume) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
        <header className="border-b border-[#2a2a2a] bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#d4a017]" />
            <h1 className="text-xl font-bold text-[#fafafa]">Resume Builder</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#d4a017]/15 border border-[#d4a017]/30 mb-2">
                <ClipboardPaste className="h-8 w-8 text-[#d4a017]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#fafafa] tracking-tight">
                Paste Your Resume
              </h2>
              <p className="text-lg text-[#a0a0a0] max-w-lg mx-auto">
                Copy the text from your resume and paste it below. AI will structure it automatically so you can edit and tailor it for any job.
              </p>
            </div>

            {/* Paste Area */}
            <div className="space-y-3">
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={`Paste your entire resume text here, for example:

John Doe
Senior Software Engineer
john@email.com | (123) 456-7890 | New York, NY | linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years...

SKILLS
Python, JavaScript, React, Node.js, SQL, AWS...

EXPERIENCE
Software Engineer at Google (01/2020 – Present)
• Led development of...
• Built scalable APIs...

Software Developer at Startup (06/2017 – 12/2019)
• Implemented...

EDUCATION
B.S. Computer Science, NYU (2017)

CERTIFICATIONS
AWS Solutions Architect, Google Cloud Professional...

PROJECTS
E-Commerce Platform
• Built full-stack application...`}
                rows={16}
                className="resize-y text-sm bg-[#0d0d0d] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#444] focus:border-[#d4a017] rounded-xl"
              />

              <div className="flex items-center justify-between text-xs text-[#555]">
                <span>{resumeText.length > 0 ? `${resumeText.length.toLocaleString()} characters` : 'Paste your resume above'}</span>
                {resumeText.length > 0 && (
                  <button
                    onClick={() => setResumeText('')}
                    className="text-[#888] hover:text-[#d4a017] transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Parse Button */}
            <Button
              onClick={handleParse}
              disabled={!resumeText.trim() || parsing}
              size="lg"
              className="gap-2 min-w-[200px] bg-[#d4a017] hover:bg-[#b8860b] text-[#0a0a0a] font-semibold"
            >
              {parsing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Structuring Resume...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Parse & Structure
                </>
              )}
            </Button>

            <p className="text-xs text-[#555]">
              AI will automatically organize your resume into categories: personal info, summary, skills, experience, education, certifications & projects.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ─── EDITOR SCREEN ─────────────────────────────────────────
  const formSections = (
    <Accordion
      type="multiple"
      defaultValue={['personal-info', 'summary', 'certifications', 'skills', 'experience', 'education', 'projects']}
      className="w-full"
    >
      <AccordionItem value="personal-info">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Personal Information</AccordionTrigger>
        <AccordionContent><PersonalInfoForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="summary">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Professional Summary</AccordionTrigger>
        <AccordionContent><SummaryForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="certifications">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Certifications</AccordionTrigger>
        <AccordionContent><CertificationsForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="skills">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Technical Skills</AccordionTrigger>
        <AccordionContent><SkillsForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="experience">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Professional Experience</AccordionTrigger>
        <AccordionContent><ExperienceForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="education">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Education</AccordionTrigger>
        <AccordionContent><EducationForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="projects">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline text-[#d4a017]">Projects</AccordionTrigger>
        <AccordionContent><ProjectsForm /></AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* ─── Top Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#111] border-b border-[#2a2a2a] shadow-lg shadow-black/30">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#d4a017]" />
            <h1 className="text-lg font-bold text-[#fafafa]">Resume Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-[#a0a0a0] hover:text-[#d4a017] hover:bg-[#1c1c1c]">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">New Resume</span>
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} disabled={downloading} className="gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-[#0a0a0a] font-semibold">
              {downloading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span className="hidden sm:inline">Generating...</span></>
              ) : (
                <><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Download PDF</span></>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ─── AI Tailor Bar ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#141414] to-[#1a1a0a] border-b border-[#d4a017]/20">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-[#d4a017]" />
            <h2 className="text-[#d4a017] font-semibold text-sm">AI Resume Tailor</h2>
            <span className="text-[#666] text-xs">— Paste a job description and let AI optimize your resume</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            {/* Job Description Input */}
            <div className="flex-1 min-w-0">
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={3}
                className="resize-y text-sm bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#555] focus:border-[#d4a017]"
              />
            </div>

            {/* Right side: Personalized Instructions + Submit */}
            <div className="lg:w-[340px] flex flex-col gap-2">
              {/* Personalized Instructions Toggle */}
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-2 text-[#d4a017] hover:text-[#fde047] text-xs font-medium transition-colors"
              >
                {showInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Personalized Instructions
                <span className="text-[#666] font-normal">(optional)</span>
              </button>

              {showInstructions && (
                <Textarea
                  value={personalInstructions}
                  onChange={(e) => setPersonalInstructions(e.target.value)}
                  placeholder={`Guide the AI, e.g.:
• Focus on my 2nd experience at Optum
• Make bullet points more concise
• Highlight Python and SQL more
• Change job title to Data Engineer`}
                  rows={3}
                  className="resize-y text-xs bg-[#0a0a0a] border-[#2a2a2a] text-[#fafafa] placeholder:text-[#555] focus:border-[#d4a017]"
                />
              )}

              <Button
                onClick={handleTailor}
                disabled={tailoring || !jobDescription.trim()}
                className="gap-2 bg-[#d4a017] hover:bg-[#b8860b] text-[#0a0a0a] font-semibold w-full"
              >
                {tailoring ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Tailoring...</>
                ) : (
                  <><Send className="h-4 w-4" /> Tailor Resume</>
                )}
              </Button>
            </div>
          </div>

          {/* Info bar */}
          <div className="mt-2 flex items-start gap-1.5 text-xs text-[#555]">
            <Info className="h-3 w-3 shrink-0 mt-0.5 text-[#d4a017]" />
            <span>
              By default, AI will optimize your <strong className="text-[#d4a017]">summary, skills, and all experience</strong> sections for the job.
              Use personalized instructions to guide exactly how the AI should update your resume.
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full">
        {/* Desktop Layout */}
        <div className="hidden lg:flex h-[calc(100vh-200px)]">
          {/* Left Panel - Form */}
          <div className="w-[45%] border-r border-[#2a2a2a] overflow-y-auto bg-[#0a0a0a]">
            <div className="p-4 max-w-2xl mx-auto">
              {formSections}
            </div>
          </div>
          {/* Right Panel - Preview */}
          <div className="w-[55%] overflow-y-auto bg-[#141414]">
            <div className="p-6 flex justify-center">
              <div className="w-full max-w-[800px]">
                <ResumePreview />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="w-full rounded-none border-b border-[#2a2a2a] bg-[#111] h-12">
              <TabsTrigger value="form" className="flex-1 gap-2 text-[#a0a0a0] data-[state=active]:text-[#d4a017] data-[state=active]:bg-[#1c1c1c]">
                <FileText className="h-4 w-4" /> Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 gap-2 text-[#a0a0a0] data-[state=active]:text-[#d4a017] data-[state=active]:bg-[#1c1c1c]">
                <Eye className="h-4 w-4" /> Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 bg-[#0a0a0a]">{formSections}</div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 bg-[#141414] min-h-[calc(100vh-280px)]">
                  <ResumePreview />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Match Score Overlay */}
      {matchScore && (
        <MatchScoreDisplay score={matchScore} onClose={() => setMatchScore(null)} />
      )}
    </div>
  );
}
