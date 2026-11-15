import { apiFetch } from "../../lib/http";
import type { GitHubLinkStatus } from "./types";

export async function getLink(): Promise<GitHubLinkStatus> {
  return apiFetch<GitHubLinkStatus>("/github/link/me");
}

export async function mockLink(githubUsername: string): Promise<GitHubLinkStatus> {
  return apiFetch<GitHubLinkStatus>("/github/link/mock", {
    method: "POST",
    body: { githubUsername },
  });
}
