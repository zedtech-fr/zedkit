export const GITHUB_REPO = "zedtech-fr/zedkit";

export function githubIssueHref(n: number): string {
  return `https://github.com/${GITHUB_REPO}/issues/${n}`;
}

export function githubPullHref(n: number): string {
  return `https://github.com/${GITHUB_REPO}/pull/${n}`;
}

export function issueFullTitle(issue: { number: number; title: string }): string {
  return `#${issue.number} ${issue.title}`;
}
