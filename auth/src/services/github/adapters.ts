import type { GitHubLinkStatus } from "./types";

export interface BackendGitHubLinkResponse {
  connected?: boolean;
  githubUsername?: string;
  github_username?: string;
}

export interface BackendMockGitHubLinkRequest {
  githubUsername: string;
}

/**
 * Pure function: Maps backend response to GitHubLinkStatus.
 */
export function adaptGitHubLinkStatusResponse(
  raw: BackendGitHubLinkResponse
): GitHubLinkStatus {
  return {
    connected: Boolean(raw?.connected),
    githubUsername: raw?.githubUsername || raw?.github_username || undefined,
  };
}

/**
 * Pure function: Maps username string to backend mock link request.
 */
export function adaptMockGitHubLinkRequest(
  githubUsername: string
): BackendMockGitHubLinkRequest {
  return {
    githubUsername: githubUsername.trim(),
  };
}
