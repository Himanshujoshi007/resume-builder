'use client';

import { useResumeStore } from '@/lib/resume-store';

export function ResumePreview() {
  const { resumeData } = useResumeStore();
  const { personalInfo, summary, certifications, skills, experience, education, projects } = resumeData;

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
  ].filter(Boolean);

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
      {summary && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Summary
          </h2>
          <p className="text-justify" style={{ fontSize: '10pt' }}>{summary}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && certifications.some(c => c.trim()) && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Certifications
          </h2>
          {certifications.filter(c => c.trim()).map((cert, i) => (
            <p key={i} className="ml-4 mb-0.5" style={{ fontSize: '10pt' }}>
              • {cert}
            </p>
          ))}
        </div>
      )}

      {/* Technical Skills */}
      {skills.length > 0 && skills.some(s => s.category.trim() || s.skills.trim()) && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Technical Skills
          </h2>
          {skills.filter(s => s.category.trim() || s.skills.trim()).map((skill, i) => (
            <p key={i} className="ml-4 mb-1" style={{ fontSize: '10pt' }}>
              • <span className="font-bold">{skill.category}</span>: {skill.skills}
            </p>
          ))}
        </div>
      )}

      {/* Professional Experience */}
      {experience.length > 0 && experience.some(e => e.jobTitle.trim() || e.company.trim()) && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Professional Experience
          </h2>
          {experience.filter(e => e.jobTitle.trim() || e.company.trim()).map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold" style={{ fontSize: '10pt' }}>
                  {exp.jobTitle}{exp.company ? `, ${exp.company}` : ''}
                </span>
                <span className="text-gray-500" style={{ fontSize: '9pt', color: '#444' }}>
                  {exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ''}{exp.location ? ` | ${exp.location}` : ''}
                </span>
              </div>
              {exp.bullets.filter(b => b.trim()).map((bullet, j) => (
                <p key={j} className="ml-4 mb-0.5 text-justify" style={{ fontSize: '10pt' }}>
                  • {bullet}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && education.some(e => e.degree.trim() || e.school.trim()) && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Education
          </h2>
          {education.filter(e => e.degree.trim() || e.school.trim()).map((edu, i) => (
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
      {projects.length > 0 && projects.some(p => p.title.trim()) && (
        <div className="mb-1">
          <h2 className="text-xs font-bold uppercase tracking-wide border-b border-black pb-0.5 mb-1.5 mt-3" style={{ fontSize: '11pt', letterSpacing: '0.5px' }}>
            Projects
          </h2>
          {projects.filter(p => p.title.trim()).map((proj, i) => (
            <div key={i} className="mb-2">
              <p className="font-bold italic" style={{ fontSize: '10pt' }}>{proj.title}</p>
              {proj.bullets.filter(b => b.trim()).map((bullet, j) => (
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
