'use client';

import { useResumeStore } from '@/lib/resume-store';
import type { ExperienceEntry } from '@/lib/resume-types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export function ExperienceForm() {
  const { resumeData, setExperience } = useResumeStore();
  const { experience } = resumeData;

  const addExperience = () => {
    setExperience([
      ...experience,
      { jobTitle: '', company: '', startDate: '', endDate: '', location: '', bullets: [''] },
    ]);
  };

  const removeExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const addBullet = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: [...updated[expIndex].bullets, ''],
    };
    setExperience(updated);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...experience];
    updated[expIndex] = {
      ...updated[expIndex],
      bullets: updated[expIndex].bullets.filter((_, i) => i !== bulletIndex),
    };
    setExperience(updated);
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = value;
    updated[expIndex] = { ...updated[expIndex], bullets };
    setExperience(updated);
  };

  return (
    <div className="space-y-4">
      {experience.map((exp, expIndex) => (
        <div key={expIndex} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Experience {expIndex + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeExperience(expIndex)}
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Job Title</Label>
              <Input
                value={exp.jobTitle}
                onChange={(e) => updateExperience(expIndex, 'jobTitle', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Company</Label>
              <Input
                value={exp.company}
                onChange={(e) => updateExperience(expIndex, 'company', e.target.value)}
                placeholder="Company Name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                value={exp.startDate}
                onChange={(e) => updateExperience(expIndex, 'startDate', e.target.value)}
                placeholder="MM/YYYY"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input
                value={exp.endDate}
                onChange={(e) => updateExperience(expIndex, 'endDate', e.target.value)}
                placeholder="MM/YYYY or Present"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location</Label>
              <Input
                value={exp.location}
                onChange={(e) => updateExperience(expIndex, 'location', e.target.value)}
                placeholder="City, State"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bullet Points</Label>
            {exp.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex gap-2 items-start">
                <Textarea
                  value={bullet}
                  onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                  placeholder="Describe your achievement or responsibility..."
                  rows={2}
                  className="flex-1 resize-y text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBullet(expIndex, bulletIndex)}
                  className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addBullet(expIndex)}
              className="w-full"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Bullet Point
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addExperience}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Experience
      </Button>
    </div>
  );
}
