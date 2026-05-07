'use client';

import { useState } from 'react';
import { useResumeStore } from '@/lib/resume-store';
import { PersonalInfoForm } from '@/components/resume/personal-info-form';
import { SummaryForm } from '@/components/resume/summary-form';
import { CertificationsForm } from '@/components/resume/certifications-form';
import { SkillsForm } from '@/components/resume/skills-form';
import { ExperienceForm } from '@/components/resume/experience-form';
import { EducationForm } from '@/components/resume/education-form';
import { ProjectsForm } from '@/components/resume/projects-form';
import { ResumePreview } from '@/components/resume/resume-preview';
import { TailorDialog } from '@/components/resume/tailor-dialog';
import { UploadResumeDialog } from '@/components/resume/upload-resume-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
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
  PenLine,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { resumeData, resetResume, setResumeData } = useResumeStore();
  const [downloading, setDownloading] = useState(false);
  const [tailorOpen, setTailorOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded',
        description: 'Your resume has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    resetResume();
    toast({
      title: 'Resume Reset',
      description: 'Resume has been reset to default data.',
    });
  };

  const handleStartBlank = () => {
    setResumeData({
      personalInfo: {
        fullName: '',
        jobTitle: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
      },
      summary: '',
      certifications: [],
      skills: [],
      experience: [],
      education: [],
      projects: [],
    });
    setStarted(true);
  };

  const formSections = (
    <Accordion
      type="multiple"
      defaultValue={['personal-info', 'summary', 'certifications', 'skills', 'experience', 'education', 'projects']}
      className="w-full"
    >
      <AccordionItem value="personal-info">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Personal Information
        </AccordionTrigger>
        <AccordionContent>
          <PersonalInfoForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="summary">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Professional Summary
        </AccordionTrigger>
        <AccordionContent>
          <SummaryForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="certifications">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Certifications
        </AccordionTrigger>
        <AccordionContent>
          <CertificationsForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="skills">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Technical Skills
        </AccordionTrigger>
        <AccordionContent>
          <SkillsForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="experience">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Professional Experience
        </AccordionTrigger>
        <AccordionContent>
          <ExperienceForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="education">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Education
        </AccordionTrigger>
        <AccordionContent>
          <EducationForm />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="projects">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Projects
        </AccordionTrigger>
        <AccordionContent>
          <ProjectsForm />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  // Welcome / Start Screen
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-700" />
            <h1 className="text-xl font-bold text-slate-800">Resume Builder</h1>
          </div>
        </header>

        {/* Welcome Content */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-2">
                <FileText className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Build Your Perfect Resume
              </h2>
              <p className="text-lg text-slate-500 max-w-lg mx-auto">
                Upload an existing resume to edit, create one from scratch, or let AI tailor your resume for any job.
              </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto">
              {/* Upload Resume */}
              <button
                onClick={() => setUploadOpen(true)}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Upload className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Upload Resume</p>
                  <p className="text-xs text-slate-500 mt-0.5">Import from PDF</p>
                </div>
              </button>

              {/* Start Blank */}
              <button
                onClick={handleStartBlank}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <PenLine className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Start Blank</p>
                  <p className="text-xs text-slate-500 mt-0.5">Create from scratch</p>
                </div>
              </button>

              {/* AI Tailor */}
              <button
                onClick={() => {
                  setStarted(true);
                  setTimeout(() => setTailorOpen(true), 300);
                }}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">AI Tailor</p>
                  <p className="text-xs text-slate-500 mt-0.5">Optimize for a job</p>
                </div>
              </button>
            </div>

            {/* Tip */}
            <p className="text-xs text-slate-400">
              Upload your existing resume PDF and we&apos;ll automatically extract all the information for you
            </p>
          </div>
        </main>

        {/* Upload Dialog */}
        <UploadResumeDialog
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open);
            if (!open) {
              // If a resume was loaded (has a name), transition to editor
              const currentData = useResumeStore.getState().resumeData;
              if (currentData.personalInfo.fullName.trim()) {
                setStarted(true);
              }
            }
          }}
        />
      </div>
    );
  }

  // Main Editor View
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Toolbar */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-700" />
            <h1 className="text-lg font-bold text-slate-800">Resume Builder</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadOpen(true)}
              className="gap-2 text-slate-600"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2 text-slate-600"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <TailorDialog open={tailorOpen} onOpenChange={setTailorOpen} />
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Desktop: Two panels, Mobile: Tabs */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full">
        {/* Desktop Layout */}
        <div className="hidden lg:flex h-[calc(100vh-57px)]">
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
                <FileText className="h-4 w-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1 gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-0">
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-4">
                  {formSections}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="mt-0">
              <ScrollArea className="h-[calc(100vh-120px)]">
                <div className="p-4 bg-slate-100 min-h-[calc(100vh-120px)]">
                  <ResumePreview />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Upload Dialog (from toolbar) */}
      <UploadResumeDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
