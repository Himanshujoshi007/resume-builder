import { create } from 'zustand';
import type { ResumeData } from './resume-types';

// Safely convert any value to string
function safeStr(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return fallback;
}

// Normalize resume data from potentially malformed AI responses
function normalizeResumeData(data: unknown): ResumeData {
  const d = (data && typeof data === 'object') ? data as Record<string, unknown> : {};

  const personalInfo = (d.personalInfo && typeof d.personalInfo === 'object')
    ? d.personalInfo as Record<string, unknown>
    : {} as Record<string, unknown>;

  // Normalize certifications: ensure all items are strings
  const rawCerts = Array.isArray(d.certifications) ? d.certifications : [];
  const certifications = rawCerts.map((c: unknown) => {
    if (typeof c === 'string') return c;
    if (typeof c === 'object' && c !== null) return JSON.stringify(c);
    return String(c);
  }).filter((s: string) => s.trim().length > 0);

  // Normalize skills: ensure all items have { category: string, skills: string }
  const rawSkills = Array.isArray(d.skills) ? d.skills : [];
  const skills = rawSkills.map((s: unknown) => {
    if (typeof s === 'string') return { category: s, skills: '' };
    if (typeof s === 'object' && s !== null) {
      const obj = s as Record<string, unknown>;
      return {
        category: safeStr(obj.category),
        skills: safeStr(obj.skills),
      };
    }
    return null;
  }).filter((s): s is { category: string; skills: string } => s !== null);

  // Normalize experience
  const rawExp = Array.isArray(d.experience) ? d.experience : [];
  const experience = rawExp.map((e: unknown) => {
    if (typeof e !== 'object' || e === null) return null;
    const obj = e as Record<string, unknown>;
    const rawBullets = Array.isArray(obj.bullets) ? obj.bullets : [];
    const bullets = rawBullets.map((b: unknown) => {
      if (typeof b === 'string') return b;
      return String(b);
    }).filter((b: string) => b.trim().length > 0);
    return {
      jobTitle: safeStr(obj.jobTitle),
      company: safeStr(obj.company),
      startDate: safeStr(obj.startDate),
      endDate: safeStr(obj.endDate),
      location: safeStr(obj.location),
      bullets,
    };
  }).filter((e): e is ResumeData['experience'][0] => e !== null);

  // Normalize education
  const rawEdu = Array.isArray(d.education) ? d.education : [];
  const education = rawEdu.map((e: unknown) => {
    if (typeof e !== 'object' || e === null) return null;
    const obj = e as Record<string, unknown>;
    return {
      degree: safeStr(obj.degree),
      startDate: safeStr(obj.startDate),
      endDate: safeStr(obj.endDate),
      school: safeStr(obj.school),
      location: safeStr(obj.location),
    };
  }).filter((e): e is ResumeData['education'][0] => e !== null);

  // Normalize projects
  const rawProj = Array.isArray(d.projects) ? d.projects : [];
  const projects = rawProj.map((p: unknown) => {
    if (typeof p !== 'object' || p === null) return null;
    const obj = p as Record<string, unknown>;
    const rawBullets = Array.isArray(obj.bullets) ? obj.bullets : [];
    const bullets = rawBullets.map((b: unknown) => {
      if (typeof b === 'string') return b;
      return String(b);
    }).filter((b: string) => b.trim().length > 0);
    return {
      title: safeStr(obj.title),
      bullets,
    };
  }).filter((p): p is ResumeData['projects'][0] => p !== null);

  return {
    personalInfo: {
      fullName: safeStr(personalInfo.fullName),
      jobTitle: safeStr(personalInfo.jobTitle),
      email: safeStr(personalInfo.email),
      phone: safeStr(personalInfo.phone),
      location: safeStr(personalInfo.location),
      linkedin: safeStr(personalInfo.linkedin),
    },
    summary: safeStr(d.summary),
    certifications,
    skills,
    experience,
    education,
    projects,
  };
}

const defaultResumeData: ResumeData = {
  personalInfo: {
    fullName: "Soumya Merugu",
    jobTitle: "Healthcare Data Analyst",
    email: "merugusoumya24@gmail.com",
    phone: "(667) 802-7550",
    location: "USA",
    linkedin: "LinkedIn"
  },
  summary: "Healthcare Data Analyst with 3+ years of experience delivering actionable insights through data analysis, reporting, and visualization in healthcare environments. Skilled in Python, SQL, Excel, Power BI, and Tableau for data cleaning, dashboard development, and predictive analytics. Experienced in working with large-scale clinical and operational datasets to improve efficiency, patient outcomes, and decision-making. Strong understanding of data governance, ETL processes, and healthcare analytics in fast-paced, cross-functional environments.",
  certifications: [
    "PL-300 (Microsoft Certified: Power BI Data Analyst Associate)",
    "AWS Certified Cloud Practitioner",
    "HIPAA Awareness Certification from American Health Training"
  ],
  skills: [
    { category: "Data Analysis & Statistical Modeling", skills: "Python (regression, cohort, logistic), Excel (pivot tables, macros, VLOOKUP, nested formulas), predictive and prescriptive analytics, process mining, trend analysis, cohort modeling." },
    { category: "Healthcare Data Management", skills: "SQL, ETL processes, HL7 standards, Epic and Cerner EHR systems, clinical data integration, data standardization, metadata documentation, HIPAA-compliant data handling." },
    { category: "Business Intelligence & Visualization", skills: "Power BI (DAX measures, dashboards), Tableau (interactive dashboards, KPI tracking), Excel Power Query, real-time operational and patient outcome visualization." },
    { category: "Operational & Workforce Analytics", skills: "Resource allocation optimization, staffing pattern analysis, patient flow monitoring, readmission risk prediction, workflow documentation, clinical and HR stakeholder collaboration." },
    { category: "Project & Compliance Management", skills: "Requirement gathering, cross-functional team collaboration, audit-ready documentation, quality improvement tracking, population health analytics, supporting operational efficiency and evidence-based clinical decisions." }
  ],
  experience: [
    {
      jobTitle: "Healthcare Data Analyst",
      company: "MedStar Health",
      startDate: "08/2025",
      endDate: "Present",
      location: "MD, USA",
      bullets: [
        "Managed the \"Patient Flow & Workforce Optimization Analytics\" project within a multi-hospital system, extracting staffing and patient data from Epic EHR and Cerner EHR, improving workforce efficiency through demand-based staffing models by 18%.",
        "Performed Python-based statistical analyses including regression, trend, and cohort modeling on clinical and demographic datasets, ensuring data validation and quality assurance, generating actionable insights that reduced patient care delays by 15%.",
        "Executed advanced Excel analyses using macros, pivot tables, VLOOKUPs, and nested formulas for ad-hoc reporting, monitoring staffing patterns and patient outcomes, enabling faster operational decisions and improving resource allocation efficiency by 12%.",
        "Standardized and integrated multi-facility healthcare datasets using SQL and HL7 standards, improving interoperability across departments, increasing data accessibility by 22%, and enabling HIPAA-compliant reporting, coordinated care initiatives, and quality improvement tracking.",
        "Collaborated with clinical managers, HR teams, and IT specialists to translate operational and clinical requirements into actionable insights, presenting findings that improved workforce utilization by 10% and enhanced overall patient satisfaction across MedStar facilities.",
        "Developed interactive Power BI dashboards using DAX measures, visualizing staffing ratios, patient outcomes, and operational KPIs, providing leadership with real-time insights that improved timely interventions, reporting accuracy, and data-driven decision-making across hospitals."
      ]
    },
    {
      jobTitle: "Healthcare & EHR Data Analyst",
      company: "Optum",
      startDate: "02/2022",
      endDate: "07/2024",
      location: "Hyderabad, India",
      bullets: [
        "Executed clinical data integration using SQL and ETL processes, consolidating multi-source EHR datasets, collaborating with clinicians and IT teams to enhance data integrity, accessibility, and governance, improving analytics-driven decision-making efficiency across hospital units by 20%.",
        "Designed descriptive analytics solutions with Excel Power Query, pivot tables, and automated dashboards, tracking patient flow, resource utilization, and operational KPIs, increasing departmental responsiveness to clinical demands and workflow efficiency by 18%.",
        "Developed predictive models using Python, logistic regression, and statistical analysis, identifying high-risk patients and supporting evidence-based interventions, reducing readmission rates by 15% and optimizing care pathways in specialty clinics and critical care departments.",
        "Implemented prescriptive analytics frameworks using process mining and workflow analysis to identify inefficiencies, optimize diagnostic routing, and recommend operational improvements, increasing diagnostic accuracy and clinical decision-support reliability by 12% across care pathways.",
        "Built interactive Tableau dashboards integrating SQL datasets, enabling visualization of quality-of-care metrics, documentation gaps, and patient outcomes, increasing visibility for leadership and compliance teams by 22%, while supporting population health management initiatives.",
        "Prepared detailed analytics documentation, metadata resources, and Excel reporting for compliance, audit readiness, and secure data handling, maintaining 100% adherence to healthcare data governance, HIPAA regulations, and organizational security protocols during system upgrades.",
        "Collaborated with cross-functional teams, including IT, clinical, and operational stakeholders, to implement data-driven insights, improve hospital policies, and support population health strategies, enhancing operational efficiency, care coordination, and patient outcomes by 14%."
      ]
    }
  ],
  education: [
    {
      degree: "Master of Health Information Technology (HIT)",
      startDate: "08/2024",
      endDate: "05/2026",
      school: "University of Maryland, Baltimore County (UMBC)",
      location: "Maryland, USA"
    },
    {
      degree: "Bachelor of Dental Surgery (BDS)",
      startDate: "08/2018",
      endDate: "01/2023",
      school: "Kaloji Narayana Rao University of Health Sciences",
      location: "India"
    }
  ],
  projects: [
    {
      title: "Healthcare Claims Denial & Readmission Risk Analysis",
      bullets: [
        "Performed exploratory data analysis on healthcare claims and patient encounters using Python and SQL, built logistic regression models to predict 30-day readmissions, addressed class imbalance, and created interactive Tableau and Power BI dashboards for insights."
      ]
    },
    {
      title: "Patient Treatment Cost Optimization",
      bullets: [
        "Analyzed hospital treatment and billing data using Python and SQL, identified cost drivers, developed predictive models for procedure expenses, and created interactive Tableau and Power BI dashboards to highlight opportunities for reducing patient costs and improving operational efficiency."
      ]
    }
  ]
};

interface ResumeStore {
  resumeData: ResumeData;
  setPersonalInfo: (personalInfo: ResumeData['personalInfo']) => void;
  setSummary: (summary: string) => void;
  setCertifications: (certifications: string[]) => void;
  setSkills: (skills: ResumeData['skills']) => void;
  setExperience: (experience: ResumeData['experience']) => void;
  setEducation: (education: ResumeData['education']) => void;
  setProjects: (projects: ResumeData['projects']) => void;
  setResumeData: (data: ResumeData) => void;
  resetResume: () => void;
}

export const useResumeStore = create<ResumeStore>((set) => ({
  resumeData: defaultResumeData,

  setPersonalInfo: (personalInfo) =>
    set((state) => ({ resumeData: { ...state.resumeData, personalInfo } })),

  setSummary: (summary) =>
    set((state) => ({ resumeData: { ...state.resumeData, summary } })),

  setCertifications: (certifications) =>
    set((state) => ({ resumeData: { ...state.resumeData, certifications } })),

  setSkills: (skills) =>
    set((state) => ({ resumeData: { ...state.resumeData, skills } })),

  setExperience: (experience) =>
    set((state) => ({ resumeData: { ...state.resumeData, experience } })),

  setEducation: (education) =>
    set((state) => ({ resumeData: { ...state.resumeData, education } })),

  setProjects: (projects) =>
    set((state) => ({ resumeData: { ...state.resumeData, projects } })),

  setResumeData: (data) => set({ resumeData: normalizeResumeData(data) }),

  resetResume: () => set({ resumeData: defaultResumeData }),
}));
