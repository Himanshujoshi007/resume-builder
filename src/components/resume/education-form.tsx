'use client';

import { useResumeStore } from '@/lib/resume-store';
import type { EducationEntry } from '@/lib/resume-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { SectionTailorButton } from '@/components/resume/section-tailor-button';

export function EducationForm() {
  const { resumeData, setEducation } = useResumeStore();
  const { education } = resumeData;

  const addEducation = () => {
    setEducation([
      ...education,
      { degree: '', startDate: '', endDate: '', school: '', location: '' },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SectionTailorButton section="education" sectionLabel="Education" />
      </div>
      {education.map((edu, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Education {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeEducation(index)}
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Degree</Label>
            <Input
              value={edu.degree}
              onChange={(e) => updateEducation(index, 'degree', e.target.value)}
              placeholder="Bachelor of Science in Computer Science"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                value={edu.startDate}
                onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                placeholder="MM/YYYY"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                value={edu.endDate}
                onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                placeholder="MM/YYYY"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">School</Label>
              <Input
                value={edu.school}
                onChange={(e) => updateEducation(index, 'school', e.target.value)}
                placeholder="University Name"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                value={edu.location}
                onChange={(e) => updateEducation(index, 'location', e.target.value)}
                placeholder="City, State"
              />
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addEducation}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Education
      </Button>
    </div>
  );
}
