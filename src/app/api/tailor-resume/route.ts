import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { ResumeData } from '@/lib/resume-types';

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription, additionalInstructions } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resumeData or jobDescription' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build additional instructions context
    let instructionsContext = '';
    if (additionalInstructions && additionalInstructions.trim()) {
      instructionsContext = `\n\nPERSONALIZED USER INSTRUCTIONS (HIGHEST PRIORITY — these override the default behavior):
${additionalInstructions.trim()}

The user has provided these specific instructions. You MUST follow them precisely and they take priority over the default tailoring approach. Apply these instructions across ALL relevant sections of the resume. Examples of what the user might ask and how to handle them:
- "Focus on my 2nd experience at Optum" → Give more detail and emphasis to the 2nd experience entry, while still tailoring other sections
- "Make bullet points concise" → Shorten ALL bullet points in experience AND projects AND summary
- "Highlight Python and SQL more" → Emphasize Python/SQL in skills, summary, experience bullets, and projects
- "Make it more action-oriented" → Rewrite ALL bullet points across ALL sections with strong action verbs
- "Remove the project section" → Set projects to []
- "Change job title to Data Engineer" → Update personalInfo.jobTitle accordingly
- "Only update the summary" → Only modify the summary, keep everything else exactly as-is
- "Don't touch my education" → Keep education exactly as-is, tailor everything else
- "Add more technical details to experience" → Enrich ALL experience bullets with technical specifics
- "Make the summary under 3 sentences" → Rewrite summary to be concise (under 3 sentences)
Always honor the user's personalized instructions across ALL sections while maintaining alignment with the job description.`;
    }

    const prompt = `You are a professional resume writer and career coach. Your task is to tailor the resume to match the job description.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}
${instructionsContext}

${additionalInstructions && additionalInstructions.trim()
      ? 'Since the user provided personalized instructions, follow THOSE instructions as the primary guide for how to tailor the resume, while still aligning with the job description.'
      : 'DEFAULT BEHAVIOR (no personalized instructions provided): Tailor the following sections of the resume:'
    }

${!additionalInstructions || !additionalInstructions.trim() ? `
1. PROFESSIONAL SUMMARY — Rewrite to highlight experiences and skills most relevant to the JD. Use keywords from the JD naturally. Keep it impactful and concise.

2. TECHNICAL SKILLS — Reorder skill categories to put the most relevant ones first. Within each category, reorder skills so the ones matching the JD appear first. Adjust category names if they could better reflect JD terminology.

3. ALL WORK EXPERIENCE — Rewrite EVERY bullet point in EVERY experience entry to better align with the JD's keywords, requirements, and responsibilities. Reorder experiences (most relevant first). Emphasize achievements and metrics that match what the JD is looking for. Add keywords from the JD naturally into the bullet points.

4. JOB TITLE — Update personalInfo.jobTitle to match or closely align with the target job title from the JD.

5. CERTIFICATIONS — Reorder to put the most relevant ones first.

6. PROJECTS — Rewrite bullet points to emphasize aspects most relevant to the JD. Reorder projects (most relevant first).

7. EDUCATION — Keep as-is unless the JD strongly suggests a particular emphasis.
` : ''}

CRITICAL RULES:
- You MUST return ALL sections in the response, even if a section doesn't need changes — return it as-is but still include it.
- Keep all information truthful — only rephrase, reorganize, and emphasize. Never fabricate experiences, skills, or qualifications.
- Certifications MUST be an array of plain strings, NOT objects. Example: ["AWS Certified", "PL-300"]
- Bullet points in experience and projects MUST be arrays of plain strings.

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
    "overall": <number 0-100>,
    "breakdown": {
      "skills": <number 0-100>,
      "experience": <number 0-100>,
      "education": <number 0-100>,
      "keywords": <number 0-100>,
      "overallFit": <number 0-100>
    },
    "improvements": [<array of strings describing what was improved>]
  }
}

The matchScore should reflect the ORIGINAL resume's match with the job description (before tailoring).
Scoring guide: barely matches = 20-40, decent = 50-70, great = 75-90.

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
