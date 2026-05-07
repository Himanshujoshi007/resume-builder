export interface ResumeData {
  personalInfo: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  summary: string;
  certifications: string[];
  skills: SkillCategory[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
}

export interface SkillCategory {
  category: string;
  skills: string;
}

export interface ExperienceEntry {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  location: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  startDate: string;
  endDate: string;
  school: string;
  location: string;
}

export interface ProjectEntry {
  title: string;
  bullets: string[];
}
