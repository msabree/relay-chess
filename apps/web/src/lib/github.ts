export const REPO_URL = 'https://github.com/msabree/relay-chess';

/** GitHub's template picker: bug report or feature request. */
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new/choose`;

/** Open a specific issue template (see .github/ISSUE_TEMPLATE). */
export const issueUrl = (template: 'bug_report' | 'feature_request') => `${REPO_URL}/issues/new?template=${template}.yml`;
