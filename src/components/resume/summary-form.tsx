'use client';

import { useResumeStore } from '@/lib/resume-store';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SectionTailorButton } from '@/components/resume/section-tailor-button';

export function SummaryForm() {
  const { resumeData, setSummary } = useResumeStore();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="summary">Professional Summary</Label>
        <SectionTailorButton section="summary" sectionLabel="Professional Summary" />
      </div>
      <Textarea
        id="summary"
        value={resumeData.summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Write a professional summary highlighting your experience and skills..."
        rows={6}
        className="resize-y"
      />
    </div>
  );
}
