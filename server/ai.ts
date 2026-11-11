import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface CommitSuggestionOptions {
  resumeName?: string;
  category?: string;
  versionLabel?: string;
  userNotes?: string;
  previousCommit?: string;
}

export interface VersionDiffAnalysisOptions {
  documentName: string;
  versionA: { versionLabel?: string; label?: string; commitMessage?: string; commit?: string; date?: string };
  versionB: { versionLabel?: string; label?: string; commitMessage?: string; commit?: string; date?: string };
  notes?: string;
}

/**
 * Intelligent Git-Style Commit Message Generator
 * Uses Gemini AI if GEMINI_API_KEY is configured, otherwise uses structured heuristics.
 */
export async function generateCommitMessage(options: CommitSuggestionOptions): Promise<string> {
  const { resumeName = 'Document', category = 'resume', versionLabel = 'v2', userNotes = '', previousCommit } = options;

  if (aiClient) {
    try {
      const prompt = `You are a software engineer and expert resume version control assistant.
Generate a single, concise, professional Git-style commit message for updating a ${category} titled "${resumeName}".
Version label: ${versionLabel}
${userNotes ? `User notes: "${userNotes}"` : ''}
${previousCommit ? `Previous commit was: "${previousCommit}"` : ''}

Rules:
1. Follow conventional commit format: type(scope): subject (e.g. feat(experience): add Senior Backend impact metrics or fix(typo): correct employment dates).
2. Exactly 1 line only. Do not add quotes, markdown backticks, or explanation.
3. Keep it under 72 characters.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const message = response.text ? response.text.trim().replace(/^["'`]|["'`]$/g, '') : '';
      if (message && message.length > 5) {
        return message;
      }
    } catch (err: any) {
      console.warn('[Gemini AI] Notice generating commit message:', err?.message || err);
    }
  }

  // Graceful heuristic fallback if API key not present or call fails
  const heuristics: Record<string, string[]> = {
    resume: [
      'feat(experience): quantify engineering impact and metrics',
      'refactor(skills): update cloud architecture & distributed systems',
      'style(layout): polish typography and streamline executive summary',
      'feat(projects): add production case studies and metrics',
      'fix(dates): align employment history and title progression'
    ],
    proposal: [
      'feat(deliverables): update milestones and technical roadmap',
      'refactor(pricing): refine engagement scope and billing terms',
      'fix(architecture): clarify API contracts and SLA guarantees'
    ],
    portfolio: [
      'feat(projects): showcase interactive UI architecture case study',
      'style(branding): modernize color accents and typography hierarchy'
    ]
  };

  const pool = heuristics[category] || heuristics.resume;
  if (userNotes && userNotes.trim().length > 3) {
    const cleanNotes = userNotes.trim();
    return `feat(revision): ${cleanNotes.slice(0, 50).toLowerCase()}`;
  }

  const selected = pool[Math.floor(Math.random() * pool.length)];
  return selected;
}

/**
 * Intelligent Version Diff Analyzer
 * Compares two resume revisions and generates a changelog breakdown
 */
export async function analyzeVersionDiff(options: VersionDiffAnalysisOptions): Promise<{
  summary: string;
  highlights: string[];
  keyHighlights: string[];
  recommendations: string[];
}> {
  const { documentName, versionA, versionB, notes } = options;
  const labelA = versionA.versionLabel || versionA.label || 'v1.0';
  const labelB = versionB.versionLabel || versionB.label || 'v2.0';
  const commitA = versionA.commitMessage || versionA.commit || 'Initial revision';
  const commitB = versionB.commitMessage || versionB.commit || 'Updated revision';

  if (aiClient) {
    try {
      const prompt = `You are an expert resume reviewer and technical version control analyst.
Analyze the differences between two versions of the document "${documentName}":
- Earlier Version (${labelA}): "${commitA}"
- Newer Version (${labelB}): "${commitB}"
${notes ? `Additional revision context: ${notes}` : ''}

Provide a JSON object response with:
{
  "summary": "1-2 sentence executive summary of what evolved between ${labelA} and ${labelB}",
  "highlights": ["3 concise bullet points describing the progression"],
  "recommendations": ["2 actionable suggestions to optimize this revision for recruiters"]
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const h = Array.isArray(parsed.highlights) ? parsed.highlights : [];
        return {
          summary: parsed.summary || `Progression from ${labelA} to ${labelB}`,
          highlights: h,
          keyHighlights: h,
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
        };
      }
    } catch (err: any) {
      console.warn('[Gemini AI] Notice analyzing version diff:', err?.message || err);
    }
  }

  // Graceful fallback
  const fallbackHighlights = [
    `Iterated from ${labelA} ("${commitA}") to ${labelB}`,
    `Published latest revision "${commitB}"`,
    `Telemetry tracking active for recruiter views on ${labelB}`
  ];

  return {
    summary: `Version ${labelB} updates the document with "${commitB}", progressing from ${labelA}.`,
    highlights: fallbackHighlights,
    keyHighlights: fallbackHighlights,
    recommendations: [
      'Share this revision directly with target recruiters using your canonical Trackd link',
      'Monitor reader dwell time in Analytics to verify recruiter engagement'
    ]
  };
}
