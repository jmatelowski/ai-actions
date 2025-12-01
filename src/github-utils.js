import {getOctokit} from "@actions/github";
import * as core from "@actions/core";
import { getISOWeek, getWeekEnd, getWeekStart } from "./utils";

export function getRepoInfo() {
  const repository = process.env.GITHUB_REPOSITORY || "";
  const [owner, repo] = repository.split("/");

  return {owner, repo};
}

function shouldIncludeFullPatch(file) {
  // Ignore generated files
  if (file.filename.includes('package-lock.json')) return false;
  if (file.filename.includes('yarn.lock')) return false;
  if (file.filename.includes('pnpm-lock.yaml')) return false;
  if (file.filename.includes('dist/')) return false;
  
  // For small changes - include full patch
  if (file.changes < 50) return true;
  
  // For large changes - skip patch
  return false;
}

function groupCommitsByWeek(commits) {
  // ISO week calculation (UTC)
  const groups = new Map();
  
  commits.forEach(commit => {
    const date = new Date(commit.commit.author.date);
    const weekKey = getISOWeek(date);
    
    if (!groups.has(weekKey)) {
      groups.set(weekKey, {
        weekStart: getWeekStart(date),
        weekEnd: getWeekEnd(date),
        commits: []
      });
    }
    
    groups.get(weekKey).commits.push(commit);
  });
  
  return Array.from(groups.values());
}

export async function getCommitsGroupedByWeek({token, owner, repo, commitsCount = 10}) {
  const octokit = getOctokit(token);

  try {
    // Get the list of commits with metadata
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: commitsCount
    });

    // Group by weeks (UTC)
    const weekGroups = groupCommitsByWeek(commits);
  
    // For each commit get the details of the changes
    const enrichedWeeks = await Promise.all(
      weekGroups.map(async (week) => {
        const enrichedCommits = await Promise.all(
          week.commits.map(async (commit) => {
            const { data: commitData } = await octokit.rest.repos.getCommit({
              owner,
              repo,
              ref: commit.sha
            });
            
            return {
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author.name,
              date: commit.commit.author.date,
              files: commitData.files.map(file => ({
                filename: file.filename,
                status: file.status,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: shouldIncludeFullPatch(file) ? file.patch : null
              }))
            };
          })
        );
        
        return {
          ...week,
          commits: enrichedCommits
        };
      })
    );
    
    return enrichedWeeks;
  } catch (error) {
    core.error(`Error getting last commits diff: ${error.message}`);
    throw error;
  }
}