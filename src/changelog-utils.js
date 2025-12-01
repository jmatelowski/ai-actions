import * as fs from 'fs';
import * as core from "@actions/core";

/**
 * Read existing changelog file
 * @param {string} changelogPath - Path to CHANGELOG.md
 * @returns {string} - Content of changelog or empty string
 */
export function readChangelog(changelogPath = 'CHANGELOG.md') {
  try {
    if (fs.existsSync(changelogPath)) {
      const content = fs.readFileSync(changelogPath, 'utf8');
      core.info(`Read existing changelog from ${changelogPath}`);
      return content;
    } else {
      core.info('No existing changelog found, will create new one');
      return '';
    }
  } catch (error) {
    core.warning(`Error reading changelog: ${error.message}`);
    return '';
  }
}
