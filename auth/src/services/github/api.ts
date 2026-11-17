import { apiFetch } from "../../lib/http";
import {
  adaptGitHubLinkStatusResponse,
  adaptMockGitHubLinkRequest,
  type BackendGitHubLinkResponse,
} from "./adapters";
import type { GitHubLinkStatus } from "./types";

/**
 * Get GitHub connection status: GET /api/v1/github/link/me
 * Contracts: Section 5.3
 */
export async function getLink(): Promise<GitHubLinkStatus> {
  const raw = await apiFetch<BackendGitHubLinkResponse>("/api/v1/github/link/me");
  return adaptGitHubLinkStatusResponse(raw);
}

/**
 * Connect simulated GitHub account: POST /api/v1/github/link/mock
 * Contracts: Section 5.3
 */
export async function mockLink(githubUsername: string): Promise<GitHubLinkStatus> {
  const reqBody = adaptMockGitHubLinkRequest(githubUsername);
  const raw = await apiFetch<BackendGitHubLinkResponse>("/api/v1/github/link/mock", {
    method: "POST",
    body: reqBody,
  });
  return adaptGitHubLinkStatusResponse(raw);
}
