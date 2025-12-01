import { GoogleGenerativeAI } from "@google/genai";
import * as core from "@actions/core";

/**
 * Format commits data for AI processing
 * @param {Array} weeks - Weeks with commits grouped
 * @returns {string} - Formatted text for AI
 */
function formatCommitsForAI(weeks) {
  return weeks.map(week => {
    const commitsText = week.commits
      .filter(commit => {
        // Filter out merge commits
        return !commit.message.toLowerCase().startsWith('merge');
      })
      .map(commit => {
        const filesText = commit.files
          .filter(file => {
            // Skip lock files and config files
            return !file.filename.includes('package-lock.json') &&
                   !file.filename.includes('yarn.lock') &&
                   !file.filename.includes('pnpm-lock.yaml');
          })
          .map(file => {
            let fileInfo = `  - ${file.filename} (${file.status}): +${file.additions} -${file.deletions}`;
            if (file.patch) {
              // Include patch for better context
              const patchLines = file.patch.split('\n').slice(0, 20).join('\n');
              fileInfo += `\n${patchLines}`;
            }
            return fileInfo;
          })
          .join('\n');

        return `
**Commit:** ${commit.message}
**Author:** ${commit.author}
**Date:** ${commit.date}
**Files changed:**
${filesText}
`;
      })
      .join('\n---\n');

    return {
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      commitsText
    };
  }).filter(week => week.commitsText.length > 0);
}

/**
 * Generate and merge changelog using Gemini AI (single prompt approach)
 * @param {Array} weeks - Weeks with commits grouped
 * @param {string} oldChangelog - Existing changelog content
 * @param {string} apiKey - Google API key
 * @returns {Promise<string>} - Complete merged changelog
 */
export async function generateAndMergeChangelog(weeks, oldChangelog, apiKey) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const formattedWeeks = formatCommitsForAI(weeks);
    
    if (formattedWeeks.length === 0) {
      core.warning('No meaningful commits found to generate changelog');
      return oldChangelog || '# Changelog\n\nNo changes to report.';
    }

    // Format weeks data for the prompt
    const weeksData = formattedWeeks.map(week => `
### Week: ${week.weekStart} to ${week.weekEnd}

${week.commitsText}
    `).join('\n\n');

    // Create single prompt that generates AND merges
    const prompt = `You are a technical documentation expert. Your task is to analyze commits and create/update a changelog.

EXISTING CHANGELOG:
${oldChangelog || '# Changelog\n\nAll notable changes to this project will be documented in this file.'}

NEW COMMITS TO ANALYZE:
${weeksData}

TASK:
1. Analyze the new commits and group changes by category: Features, Bug Fixes, Performance, Documentation, Refactoring, Other
2. For each category, create concise bullet points in markdown format
3. Create a new section for each week with date headers like: ## [${formattedWeeks[0]?.weekStart || 'YYYY-MM-DD'}]
4. Merge the new sections into the existing changelog at the top (newest first)
5. Avoid duplicates - check if similar changes already exist
6. Ignore merge commits and trivial configuration changes
7. Use professional, clear language that describes WHAT changed and WHY it matters
8. Each bullet point should be actionable and user-focused

OUTPUT FORMAT RULES:
- Start with "# Changelog" header if not present
- New week sections go at the TOP (after the header)
- Keep chronological order (newest first)
- Only include categories that have actual changes
- Each bullet should start with a verb (Added, Fixed, Improved, Updated, etc.)
- Be concise but descriptive

Return ONLY the complete merged changelog in markdown format. No explanations, no additional text.`;

    core.info('Sending request to Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const mergedChangelog = response.text();
    
    core.info('Successfully generated and merged changelog');
    return mergedChangelog;
    
  } catch (error) {
    core.error(`Error generating changelog with AI: ${error.message}`);
    throw error;
  }
}

