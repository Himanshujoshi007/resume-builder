'use client';

import { useState, useRef, useEffect } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import type { ResumeData } from '@/lib/resume-types';
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
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Info,
  Clock,
  LogOut,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { resumeData, resetResume, setResumeData } = useResumeStore();
  const [downloading, setDownloading] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Tailor state
  const [jobDescription, setJobDescription] = useState('');
  const [personalInstructions, setPersonalInstructions] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [matchScore, setMatchScore] = useState<MatchScore | null>(null);

  // Flow state: false = upload screen, true = editor
  const [hasResume, setHasResume] = useState(false);

  // Auth & subscription state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const { toast } = useToast();
  const router = useRouter();

  // Check auth and subscription on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const meRes = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!meRes.ok) {
          router.replace('/login');
          return;
        }
        const meData = await meRes.json();
        setUserRole(meData.user.role);

        if (meData.user.role === 'client') {
          const subRes = await fetch('/api/auth/subscription', { credentials: 'same-origin' });
          const subData = await subRes.json();
          if (subData.isExpired || !subData.isActive) {
            setIsExpired(true);
            setDaysRemaining(0);
          } else {
            setDaysRemaining(subData.daysRemaining);
          }
        }
      } catch {
        router.replace('/login');
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    router.replace('/login');
  };

  // Loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Expired screen for clients
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Clock className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Subscription Expired</h2>
          <p className="text-slate-500">Your 30-day access period has ended. Please contact the administrator to renew your subscription.</p>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  // ─── Upload handlers ───────────────────────────────────────
  const handleFileSelect = (file: File) => {
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Invalid File', description: 'Please upload a PDF file.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) handleFileSelect(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      const response = await fetch('/api/parse-resume', { method: 'POST', body: formData });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse resume');
      }
      const data = await response.json();
      setResumeData(data.resumeData as ResumeData);
      setSelectedFile(null);
      setHasResume(true);
      toast({ title: 'Resume Uploaded', description: 'Your resume has been parsed successfully. You can now edit and tailor it.' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Upload Failed', description: error instanceof Error ? error.message : 'Failed to parse resume.', variant: 'destructive' });
    } finally {
      setUploading(false);
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
      if (!response.ok) throw new Error('Failed to tailor resume');
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

  // ─── PDF Download ──────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
    setJobDescription('');
    setPersonalInstructions('');
    setMatchScore(null);
    toast({ title: 'Reset', description: 'Resume has been reset.' });
  };

  // ─── UPLOAD SCREEN ─────────────────────────────────────────
  if (!hasResume) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-700" />
            <h1 className="text-xl font-bold text-slate-800">Resume Builder</h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-xl w-full text-center space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-2">
                <Upload className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Upload Your Resume
              </h2>
              <p className="text-lg text-slate-500 max-w-lg mx-auto">
                Upload your existing resume PDF and we&apos;ll extract everything automatically. Then you can edit and tailor it for any job.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                transition-all duration-200
                ${dragActive
                  ? 'border-emerald-400 bg-emerald-50 scale-[1.02]'
                  : selectedFile
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInputChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-slate-700">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Choose a different file
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className={`h-10 w-10 ${dragActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <p className="font-medium text-slate-600">Drag & drop your resume PDF here</p>
                  <p className="text-sm text-slate-400">or click to browse files</p>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              size="lg"
              className="gap-2 min-w-[200px]"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Parsing Resume...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Upload & Extract
                </>
              )}
            </Button>

            <p className="text-xs text-slate-400">
              Supports PDF resumes with selectable text
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
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Personal Information</AccordionTrigger>
        <AccordionContent><PersonalInfoForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="summary">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Professional Summary</AccordionTrigger>
        <AccordionContent><SummaryForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="certifications">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Certifications</AccordionTrigger>
        <AccordionContent><CertificationsForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="skills">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Technical Skills</AccordionTrigger>
        <AccordionContent><SkillsForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="experience">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Professional Experience</AccordionTrigger>
        <AccordionContent><ExperienceForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="education">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Education</AccordionTrigger>
        <AccordionContent><EducationForm /></AccordionContent>
      </AccordionItem>
      <AccordionItem value="projects">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">Projects</AccordionTrigger>
        <AccordionContent><ProjectsForm /></AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ─── Top Bar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-slate-700" />
            <h1 className="text-lg font-bold text-slate-800">Resume Builder</h1>
            {/* Subscription countdown for clients */}
            {userRole === 'client' && daysRemaining !== null && (
              <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                daysRemaining > 10 ? 'bg-emerald-50 text-emerald-700' :
                daysRemaining > 5 ? 'bg-amber-50 text-amber-700' :
                'bg-red-50 text-red-700'
              }`}>
                <Clock className="h-3 w-3" />
                {daysRemaining} days left
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {userRole === 'admin' && (
              <Button variant="ghost" size="sm" onClick={() => router.push('/admin')} className="gap-2 text-slate-600">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-slate-600">
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">New Resume</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-slate-600">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} disabled={downloading} className="gap-2">
              {downloading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span className="hidden sm:inline">Generating...</span></>
              ) : (
                <><FileDown className="h-4 w-4" /><span className="hidden sm:inline">Download PDF</span></>
              )}
            </Button>
          </div>
        </div>
        {/* Mobile subscription banner for clients */}
        {userRole === 'client' && daysRemaining !== null && (
          <div className={`sm:hidden px-4 py-1.5 text-center text-xs font-medium ${
            daysRemaining > 10 ? 'bg-emerald-50 text-emerald-700' :
            daysRemaining > 5 ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
          }`}>
            <Clock className="h-3 w-3 inline mr-1" />
            {daysRemaining} days remaining in your subscription
          </div>
        )}
      </header>

      {/* ─── AI Tailor Bar ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h2 className="text-white font-semibold text-sm">AI Resume Tailor</h2>
            <span className="text-slate-400 text-xs">— Paste a job description and let AI optimize your resume</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            {/* Job Description Input */}
            <div className="flex-1 min-w-0">
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={3}
                className="resize-y text-sm bg-white/95 border-slate-600 placeholder:text-slate-400"
              />
            </div>

            {/* Right side: Personalized Instructions + Submit */}
            <div className="lg:w-[340px] flex flex-col gap-2">
              {/* Personalized Instructions Toggle */}
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex items-center gap-2 text-amber-300 hover:text-amber-200 text-xs font-medium transition-colors"
              >
                {showInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Personalized Instructions
                <span className="text-slate-400 font-normal">(optional)</span>
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
                  className="resize-y text-xs bg-white/95 border-slate-600 placeholder:text-slate-400"
                />
              )}

              <Button
                onClick={handleTailor}
                disabled={tailoring || !jobDescription.trim()}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full"
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
          <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            <span>
              By default, AI will optimize your <strong className="text-slate-300">summary, skills, and all experience</strong> sections for the job.
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
          <div className="w-[45%] border-r overflow-y-auto">
            <div className="p-4 max-w-2xl mx-auto">
              {formSections}
            </div>
          </div>
          {/* Right Panel - Preview */}
          <div className="w-[55%] overflow-y-auto bg-slate-100">
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
            <TabsList className="w-full rounded-none border-b bg-white h-12">
              <TabsTrigger value="form" className="flex-1 gap-2">
                <FileText className="h-4 w-4" /> Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 gap-2">
                <Eye className="h-4 w-4" /> Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4">{formSections}</div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="p-4 bg-slate-100 min-h-[calc(100vh-280px)]">
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
