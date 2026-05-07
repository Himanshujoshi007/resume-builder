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
        // If AI returned an object instead of a string, try to stringify it
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
        // If AI returned a plain string, make it a category
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
    <div className="bg-white text-black p-8 sm:p-10 shadow-lg rounded-sm" style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', lineHeight: '1.4' }}>
      {/* Name */}
      <h1 className="text-center text-2xl sm:text-3xl font-bold mb-1" style={{ fontSize: '20pt' }}>
        {personalInfo.fullName || 'Your Name'}
      </h1>

      {/* Job Title */}
      <p className="text-center text-base sm:text-lg text-gray-600 mb-1" style={{ fontSize: '12pt', color: '#333' }}>
        {personalInfo.jobTitle || 'Job Title'}
      </p>

      {/* Contact Info */}
      {contactParts.length > 0 && (
        <p className="text-center text-xs sm:text-sm text-gray-500 mb-3" style={{ fontSize: '9pt', color: '#444' }}>
          {contactParts.join(' | ')}
        </p>
      )}

      {/* Summary */}
      {summary.trim() && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Summary
          </h2>
          <p className="text-justify" style={{ fontSize: '10pt' }}>{summary}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Certifications
          </h2>
          {certifications.map((cert, i) => (
            <p key={i} className="ml-4 mb-0.5" style={{ fontSize: '10pt' }}>
              • {cert}
            </p>
          ))}
        </div>
      )}

      {/* Technical Skills */}
      {skills.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Technical Skills
          </h2>
          {skills.map((skill, i) => (
            <p key={i} className="ml-4 mb-1" style={{ fontSize: '10pt' }}>
              • <span className="font-bold">{skill.category}</span>{skill.skills ? `: ${skill.skills}` : ''}
            </p>
          ))}
        </div>
      )}

      {/* Professional Experience */}
      {experience.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Professional Experience
          </h2>
          {experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold" style={{ fontSize: '10pt' }}>
                  {exp.jobTitle}{exp.company ? `, ${exp.company}` : ''}
                </span>
                <span className="text-gray-500" style={{ fontSize: '9pt', color: '#444' }}>
                  {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}{exp.location ? ` | ${exp.location}` : ''}
                </span>
              </div>
              {exp.bullets.map((bullet, j) => (
                <p key={j} className="ml-4 mb-0.5 text-justify" style={{ fontSize: '10pt' }}>
                  • {bullet}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-bold" style={{ fontSize: '10pt' }}>{edu.degree}</span>
                <span className="text-gray-500" style={{ fontSize: '9pt', color: '#444' }}>
                  {edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ''}
                </span>
              </div>
              <p style={{ fontSize: '10pt' }}>{edu.school}{edu.location ? `, ${edu.location}` : ''}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Projects
          </h2>
          {projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <p className="font-bold italic" style={{ fontSize: '10pt' }}>{proj.title}</p>
              {proj.bullets.map((bullet, j) => (
                <p key={j} className="ml-4 mb-0.5 text-justify" style={{ fontSize: '10pt' }}>
                  • {bullet}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
