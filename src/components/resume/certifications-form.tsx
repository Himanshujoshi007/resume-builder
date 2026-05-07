'use client';

import { useResumeStore } from '@/lib/resume-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { SectionTailorButton } from '@/components/resume/section-tailor-button';

export function CertificationsForm() {
  const { resumeData, setCertifications } = useResumeStore();
  // Ensure certifications are always strings (safety against AI returning objects)
  const certifications = resumeData.certifications.map(c =>
    typeof c === 'string' ? c : typeof c === 'object' && c !== null
      ? (c as Record<string, unknown>).name?.toString() || (c as Record<string, unknown>).certification?.toString() || JSON.stringify(c)
      : String(c)
  );

  const addCertification = () => {
    setCertifications([...certifications, '']);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index: number, value: string) => {
    const updated = [...certifications];
    updated[index] = value;
    setCertifications(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <SectionTailorButton section="certifications" sectionLabel="Certifications" />
      </div>
      {certifications.map((cert, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Input
            value={cert}
            onChange={(e) => updateCertification(index, e.target.value)}
            placeholder="e.g., PL-300 (Microsoft Certified: Power BI Data Analyst Associate)"
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeCertification(index)}
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addCertification}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Certification
      </Button>
    </div>
  );
}
