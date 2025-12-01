import * as core from "@actions/core";
import { getRepoInfo, getCommitsGroupedByWeek } from "./github-utils.js";
import { readChangelog } from "./changelog-utils.js";
import { generateAndMergeChangelog } from "./generate-changelog.js";

async function run() {
  try {
    core.info('Starting AI-powered changelog generation...');

    // Get environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    const googleApiKey = process.env.GOOGLE_API_KEY;
    const commitsCount = parseInt(process.env.COMMITS_COUNT || '10', 10);
    const changelogPath = process.env.CHANGELOG_PATH || 'CHANGELOG.md';

    if (!githubToken) {
      throw new Error("GITHUB_TOKEN is required");
    }

    if (!googleApiKey) {
      throw new Error("GOOGLE_API_KEY is required");
    }

    core.info(`Configuration: analyzing last ${commitsCount} commits`);

    // Get repository information
    const { owner, repo } = getRepoInfo();

    // Step 1: Get commits grouped by week
    core.info('Step 1/3: Fetching commits from GitHub...');
    const weeks = await getCommitsGroupedByWeek({
      token: githubToken,
      owner,
      repo,
      commitsCount
    });

    if (!weeks || weeks.length === 0) {
      core.warning('No commits found to process');
      return;
    }

    core.info('Step 2/3: Reading existing changelog...');
    const oldChangelog = readChangelog(changelogPath);

    core.info('Step 3/3: Generating and merging changelog with AI...');
    const finalChangelog = await generateAndMergeChangelog(weeks, oldChangelog, googleApiKey);

    if (!finalChangelog || finalChangelog.trim().length === 0) {
      core.warning('AI generated empty changelog');
      return;
    }

    core.info('Changelog generation completed successfully!');
    core.setOutput('changelog_content', finalChangelog);
    core.setOutput('changelog_updated', 'true');

  } catch (error) {
    core.error(`Error: ${error.message}`);
    core.setFailed(error.message);
  }
}

// Run the action
run();
