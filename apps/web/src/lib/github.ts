export const REPO_URL = 'https://github.com/msabree/relay-chess';

/** Open a specific issue template (see .github/ISSUE_TEMPLATE). */
export const issueUrl = (template: 'bug_report' | 'feature_request') => `${REPO_URL}/issues/new?template=${template}.yml`;
