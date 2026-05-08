'use client';

import { useResumeStore } from '@/lib/resume-store';
import type { ProjectEntry } from '@/lib/resume-types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

export function ProjectsForm() {
  const { resumeData, setProjects } = useResumeStore();
  const { projects } = resumeData;

  const addProject = () => {
    setProjects([...projects, { title: '', bullets: [''] }]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof ProjectEntry, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const addBullet = (projIndex: number) => {
    const updated = [...projects];
    updated[projIndex] = { ...updated[projIndex], bullets: [...updated[projIndex].bullets, ''] };
    setProjects(updated);
  };

  const removeBullet = (projIndex: number, bulletIndex: number) => {
    const updated = [...projects];
    updated[projIndex] = { ...updated[projIndex], bullets: updated[projIndex].bullets.filter((_, i) => i !== bulletIndex) };
    setProjects(updated);
  };

  const updateBullet = (projIndex: number, bulletIndex: number, value: string) => {
    const updated = [...projects];
    const bullets = [...updated[projIndex].bullets];
    bullets[bulletIndex] = value;
    updated[projIndex] = { ...updated[projIndex], bullets };
    setProjects(updated);
  };

  return (
    <div className="space-y-4">
      {projects.map((proj, projIndex) => (
        <div key={projIndex} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Project {projIndex + 1}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeProject(projIndex)}
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Project Title</Label>
            <Input value={proj.title} onChange={(e) => updateProject(projIndex, 'title', e.target.value)} placeholder="Project Name" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Bullet Points</Label>
            {proj.bullets.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex gap-2 items-start">
                <Textarea value={bullet} onChange={(e) => updateBullet(projIndex, bulletIndex, e.target.value)} placeholder="Describe the project..." rows={2} className="flex-1 resize-y text-sm" />
                <Button variant="ghost" size="icon" onClick={() => removeBullet(projIndex, bulletIndex)} className="shrink-0 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addBullet(projIndex)} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Bullet Point
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addProject} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
}
