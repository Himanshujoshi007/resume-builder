'use client';

import { useResumeStore } from '@/lib/resume-store';
import type { SkillCategory } from '@/lib/resume-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function SkillsForm() {
  const { resumeData, setSkills } = useResumeStore();
  const { skills } = resumeData;

  const addSkill = () => {
    setSkills([...skills, { category: '', skills: '' }]);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof SkillCategory, value: string) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  return (
    <div className="space-y-4">
      {skills.map((skill, index) => (
        <div key={index} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Skill Category {index + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeSkill(index)}
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-2">
            <div>
              <Label htmlFor={`skill-cat-${index}`} className="text-xs">Category</Label>
              <Input
                id={`skill-cat-${index}`}
                value={skill.category}
                onChange={(e) => updateSkill(index, 'category', e.target.value)}
                placeholder="e.g., Data Analysis & Statistical Modeling"
              />
            </div>
            <div>
              <Label htmlFor={`skill-list-${index}`} className="text-xs">Skills</Label>
              <Input
                id={`skill-list-${index}`}
                value={skill.skills}
                onChange={(e) => updateSkill(index, 'skills', e.target.value)}
                placeholder="e.g., Python, Excel, SQL..."
              />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSkill} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Skill Category
      </Button>
    </div>
  );
}
