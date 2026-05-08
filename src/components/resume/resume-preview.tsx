'use client';

import { useResumeStore } from '@/lib/resume-store';
import type { ResumeData } from '@/lib/resume-types';

// Helper: safely convert any value to a string
function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

// Helper: safely get an array, filtering to valid strings
function safeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if (typeof obj.name === 'string' && obj.name.trim()) return obj.name;
        if (typeof obj.certification === 'string' && obj.certification.trim()) return obj.certification;
        if (typeof obj.title === 'string' && obj.title.trim()) return obj.title;
        if (typeof obj.value === 'string' && obj.value.trim()) return obj.value;
        const strVals = Object.values(obj).filter((v): v is string => typeof v === 'string' && v.trim());
        if (strVals.length > 0) return strVals.join(' - ');
        return JSON.stringify(item);
      }
      return String(item);
    })
    .filter(s => s.trim().length > 0);
}

// Helper: safely get skills array with proper shape
function safeSkills(arr: unknown): { category: string; skills: string }[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => {
      if (typeof item === 'string') {
        return { category: item, skills: '' };
      }
      if (typeof item === 'object' && item !== null) {
        return {
          category: safeStr((item as Record<string, unknown>).category),
          skills: safeStr((item as Record<string, unknown>).skills),
        };
      }
      return null;
    })
    .filter((s): s is { category: string; skills: string } => s !== null && (s.category.trim().length > 0 || s.skills.trim().length > 0));
}

// Helper: safely get experience array
function safeExperience(arr: unknown): { jobTitle: string; company: string; startDate: string; endDate: string; location: string; bullets: string[] }[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => {
      if (typeof item !== 'object' || item === null) return null;
      const obj = item as Record<string, unknown>;
      return {
        jobTitle: safeStr(obj.jobTitle),
        company: safeStr(obj.company),
        startDate: safeStr(obj.startDate),
        endDate: safeStr(obj.endDate),
        location: safeStr(obj.location),
        bullets: safeStringArray(obj.bullets),
      };
    })
    .filter((e): e is { jobTitle: string; company: string; startDate: string; endDate: string; location: string; bullets: string[] } =>
      e !== null && (e.jobTitle.trim().length > 0 || e.company.trim().length > 0)
    );
}

// Helper: safely get education array
function safeEducation(arr: unknown): { degree: string; startDate: string; endDate: string; school: string; location: string }[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => {
      if (typeof item !== 'object' || item === null) return null;
      const obj = item as Record<string, unknown>;
      return {
        degree: safeStr(obj.degree),
        startDate: safeStr(obj.startDate),
        endDate: safeStr(obj.endDate),
        school: safeStr(obj.school),
        location: safeStr(obj.location),
      };
    })
    .filter((e): e is { degree: string; startDate: string; endDate: string; school: string; location: string } =>
      e !== null && (e.degree.trim().length > 0 || e.school.trim().length > 0)
    );
}

// Helper: safely get projects array
function safeProjects(arr: unknown): { title: string; bullets: string[] }[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(item => {
      if (typeof item !== 'object' || item === null) return null;
      const obj = item as Record<string, unknown>;
      return {
        title: safeStr(obj.title),
        bullets: safeStringArray(obj.bullets),
      };
    })
    .filter((p): p is { title: string; bullets: string[] } =>
      p !== null && p.title.trim().length > 0
    );
}

export function ResumePreview() {
  const { resumeData } = useResumeStore();

  // Normalize all data defensively
  const personalInfo = resumeData?.personalInfo || { fullName: '', jobTitle: '', email: '', phone: '', location: '', linkedin: '' };
  const summary = safeStr(resumeData?.summary);
  const certifications = safeStringArray(resumeData?.certifications);
  const skills = safeSkills(resumeData?.skills);
  const experience = safeExperience(resumeData?.experience);
  const education = safeEducation(resumeData?.education);
  const projects = safeProjects(resumeData?.projects);

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
  ].filter(s => s && s.trim());

  return (
    <div className="bg-[#0d0d0d] text-[#e8e8e8] p-8 sm:p-10 shadow-lg shadow-black/40 rounded-sm border border-[#2a2a2a]" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.4' }}>
      {/* Name */}
      <h1 className="text-center text-2xl sm:text-3xl font-bold mb-1 text-[#d4a017]" style={{ fontSize: '20pt' }}>
        {personalInfo.fullName || 'Your Name'}
      </h1>

      {/* Job Title */}
      <p className="text-center text-base sm:text-lg mb-1" style={{ fontSize: '12pt', color: '#b8860b' }}>
        {personalInfo.jobTitle || 'Job Title'}
      </p>

      {/* Contact Info */}
      {contactParts.length > 0 && (
        <p className="text-center text-xs sm:text-sm mb-3" style={{ fontSize: '9pt', color: '#888' }}>
          {contactParts.join(' | ')}
        </p>
      )}

      {/* Summary */}
      {summary.trim() && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-[#d4a017] pb-0.5 mb-1.5 text-[#d4a017]" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Summary
          </h2>
          <p className="text-justify text-[#ccc]" style={{ fontSize: '10pt' }}>{summary}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-[#d4a017] pb-0.5 mb-1.5 mt-3 text-[#d4a017]" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Certifications
          </h2>
          {certifications.map((cert, i) => (
            <p key={i} className="pl-3.5 mb-0.5 relative text-[#ccc]" style={{ fontSize: '10pt' }}>
              <span className="absolute left-0 top-[7px] w-[5px] h-[5px] bg-[#d4a017] rounded-full inline-block" />{cert}
            </p>
          ))}
        </div>
      )}

      {/* Technical Skills */}
      {skills.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-[#d4a017] pb-0.5 mb-1.5 mt-3 text-[#d4a017]" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Technical Skills
          </h2>
          {skills.map((skill, i) => (
            <p key={i} className="pl-3.5 mb-1 relative text-[#ccc]" style={{ fontSize: '10pt' }}>
              <span className="absolute left-0 top-[7px] w-[5px] h-[5px] bg-[#d4a017] rounded-full inline-block" /><span className="font-bold text-[#e8e8e8]">{skill.category}</span>{skill.skills ? `: ${skill.skills}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Professional Experience */}
      {experience.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-[#d4a017] pb-0.5 mb-1.5 mt-3 text-[#d4a017]" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Professional Experience
          </h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[#e8e8e8]" style={{ fontSize: '10pt' }}>
                  {exp.jobTitle}{exp.company ? `, ${exp.company}` : ''}
                </span>
                <span style={{ fontSize: '9pt', color: '#888' }}>
                  {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}{exp.location ? ` | ${exp.location}` : ''}
                </span>
              </div>
              {exp.bullets.map((bullet, j) => (
                <p key={j} className="pl-3.5 mb-0.5 text-justify relative text-[#ccc]" style={{ fontSize: '10pt' }}>
                  <span className="absolute left-0 top-[7px] w-[5px] h-[5px] bg-[#d4a017] rounded-full inline-block" />{bullet}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-[#d4a017] pb-0.5 mb-1.5 mt-3 text-[#d4a017]" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-[#e8e8e8]" style={{ fontSize: '10pt' }}>{edu.degree}</span>
                <span style={{ fontSize: '9pt', color: '#888' }}>
                  {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                </span>
              </div>
              <p className="text-[#ccc]" style={{ fontSize: '10pt' }}>{edu.school}{edu.location ? `, ${edu.location}` : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-[#d4a017] pb-0.5 mb-1.5 mt-3 text-[#d4a017]" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Projects
          </h2>
          {projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <p className="font-bold italic text-[#e8e8e8]" style={{ fontSize: '10pt' }}>{proj.title}</p>
              {proj.bullets.map((bullet, j) => (
                <p key={j} className="pl-3.5 mb-0.5 text-justify relative text-[#ccc]" style={{ fontSize: '10pt' }}>
                  <span className="absolute left-0 top-[7px] w-[5px] h-[5px] bg-[#d4a017] rounded-full inline-block" />{bullet}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
