import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { ResumeData } from '@/lib/resume-types';

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription, additionalInstructions, section } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resumeData or jobDescription' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build section-specific or full resume prompt
    let sectionContext = '';
    if (section) {
      const sectionNames: Record<string, string> = {
        'summary': 'Professional Summary',
        'certifications': 'Certifications',
        'skills': 'Technical Skills',
        'experience': 'Professional Experience',
        'education': 'Education',
        'projects': 'Projects',
        'personalInfo': 'Personal Information',
      };
      const sectionLabel = sectionNames[section] || section;
      sectionContext = `\n\nIMPORTANT FOCUS: The user wants to tailor ONLY the "${sectionLabel}" section of the resume. Return the complete resume data but only modify the "${sectionLabel}" section. Keep all other sections exactly as they are.`;
    }

    // Build additional instructions context
    let instructionsContext = '';
    if (additionalInstructions && additionalInstructions.trim()) {
      if (section) {
        instructionsContext = `\n\nADDITIONAL USER INSTRUCTIONS (HIGHEST PRIORITY — apply to the "${sectionNames[section!] || section}" section):
${additionalInstructions.trim()}

These instructions are from the user themselves and MUST be followed precisely. Apply them to the targeted section. Examples:
- "Make bullet points concise" → Shorten bullet points in this section
- "Highlight specific keywords" → Emphasize keywords from the JD in this section
- "Add more detail" → Expand entries in this section
- "Reorder to put most relevant first" → Reorder items in this section
Always honor the user's additional instructions while maintaining alignment with the job description.`;
      } else {
        instructionsContext = `\n\nADDITIONAL USER INSTRUCTIONS (HIGHEST PRIORITY — apply to ALL relevant sections):
${additionalInstructions.trim()}

These instructions are from the user themselves and MUST be followed precisely. Apply them ACROSS THE ENTIRE RESUME, not just one section. Examples:
- "Focus on my 2nd experience at Optum" → Give more detail and emphasis to the 2nd experience entry, but still tailor other sections
- "Make bullet points concise" → Shorten ALL bullet points in experience AND projects AND summary
- "Highlight Python and SQL more" → Emphasize Python/SQL in skills, summary, experience bullets, and projects
- "Make it more action-oriented" → Rewrite ALL bullet points across ALL sections with strong action verbs
- "Remove the project section" → Set projects to []
- "Expand the 3rd bullet point in 1st experience" → Make that specific bullet more detailed while keeping others tailored
- "Change job title to Data Engineer" → Update personalInfo.jobTitle accordingly
- "Add more technical details" → Enrich ALL experience and project bullets with technical specifics
Always honor the user's additional instructions across ALL sections while maintaining alignment with the job description.`;
      }
    }

    const prompt = `You are a professional resume writer and career coach. Analyze the following job description and tailor the ENTIRE resume to better match it. You MUST modify ALL sections of the resume, not just the summary.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}
${sectionContext}${instructionsContext}

You MUST tailor EVERY section of the resume as follows:

1. PERSONAL INFORMATION: Update the jobTitle to match or closely align with the target job title from the job description. Keep name, email, phone, location, linkedin unchanged.

2. PROFESSIONAL SUMMARY: Rewrite the summary to highlight experiences, skills, and qualifications most relevant to the job description. Use keywords from the JD naturally.

3. CERTIFICATIONS: Reorder certifications to put the most relevant ones first. If the JD mentions certifications the candidate should have, you may suggest them but mark suggested ones with "(Recommended)" — do not fabricate certifications the person actually holds.

4. TECHNICAL SKILLS: Reorder skill categories to put the most relevant ones first. Within each category, reorder skills so the ones matching the JD appear first. Adjust category names if they could better reflect JD terminology.

5. PROFESSIONAL EXPERIENCE: Rewrite EVERY bullet point in EVERY experience entry to better align with the job description's keywords, requirements, and responsibilities. Reorder experiences if needed (most relevant first). Emphasize achievements and metrics that match what the JD is looking for. Add keywords from the JD naturally into the bullet points.

6. EDUCATION: Keep education entries as-is unless the additional instructions specifically ask to modify them. If the JD emphasizes a particular field of study, you may add a brief note highlighting relevant coursework.

7. PROJECTS: Rewrite project bullet points to emphasize aspects most relevant to the job description. Reorder projects if needed (most relevant first). Adjust project descriptions to use keywords from the JD.

CRITICAL RULES:
- You MUST return ALL sections in the response, even if a section doesn't need changes — return it as-is but still include it.
- Keep all information truthful — only rephrase, reorganize, and emphasize. Never fabricate experiences, skills, or qualifications.
- Certifications MUST be an array of plain strings, NOT objects. Example: ["AWS Certified", "PL-300"]
- If additional user instructions are provided, apply them across ALL relevant sections, not just the summary. For example:
  * "Make bullet points concise" → shorten ALL bullets in experience AND projects
  * "Focus on 2nd experience" → give more detail/weight to the 2nd experience entry
  * "Remove projects" → set projects to an empty array []
  * "Emphasize Python" → ensure Python appears prominently in skills, summary, experience bullets, and projects
  * "Make it more action-oriented" → rewrite ALL bullet points across ALL sections with strong action verbs

Also, analyze how well the CURRENT resume (before tailoring) matches the job description and provide a match score.

Return the result as a valid JSON object with EXACTLY this structure:
{
  "tailoredResume": {
    "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "linkedin": "" },
    "summary": "",
    "certifications": ["string"],
    "skills": [{ "category": "", "skills": "" }],
    "experience": [{ "jobTitle": "", "company": "", "startDate": "", "endDate": "", "location": "", "bullets": ["string"] }],
    "education": [{ "degree": "", "startDate": "", "endDate": "", "school": "", "location": "" }],
    "projects": [{ "title": "", "bullets": ["string"] }]
  },
  "matchScore": {
    "overall": <number 0-100 representing how well the ORIGINAL resume matches the job description>,
    "breakdown": {
      "skills": <number 0-100>,
      "experience": <number 0-100>,
      "education": <number 0-100>,
      "keywords": <number 0-100>,
      "overallFit": <number 0-100>
    },
    "improvements": [<array of strings describing what was improved or could be improved>]
  }
}

The matchScore should reflect the ORIGINAL resume's match with the job description (before tailoring), so the user can see the gap.
Be generous but realistic with scoring. A resume that barely matches should score 20-40, a decent match 50-70, and a great match 75-90.

IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanation.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional resume writer. Always respond with valid JSON only. No markdown, no explanation.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanedResponse);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tailor resume error:', error);
    return NextResponse.json(
      { error: 'Failed to tailor resume. Please try again.' },
      { status: 500 }
    );
  }
}
