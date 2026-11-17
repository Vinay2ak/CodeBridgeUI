import { describe, it, expect } from "vitest";
import {
  adaptGitHubLinkStatusResponse,
  adaptMockGitHubLinkRequest,
} from "./adapters";

describe("GitHub Service Adapters", () => {
  // Fixture from contract section 5.3
  const backendConnectedFixture = {
    connected: true,
    githubUsername: "alexmercer",
  };

  const backendSnakeCaseFixture = {
    connected: true,
    github_username: "alexmercer",
  };

  const backendDisconnectedFixture = {
    connected: false,
  };

  it("adaptGitHubLinkStatusResponse maps camelCase backend response", () => {
    const res = adaptGitHubLinkStatusResponse(backendConnectedFixture);
    expect(res).toEqual({
      connected: true,
      githubUsername: "alexmercer",
    });
  });

  it("adaptGitHubLinkStatusResponse maps snake_case backend response", () => {
    const res = adaptGitHubLinkStatusResponse(backendSnakeCaseFixture);
    expect(res).toEqual({
      connected: true,
      githubUsername: "alexmercer",
    });
  });

  it("adaptGitHubLinkStatusResponse handles disconnected status", () => {
    const res = adaptGitHubLinkStatusResponse(backendDisconnectedFixture);
    expect(res).toEqual({
      connected: false,
      githubUsername: undefined,
    });
  });

  it("adaptMockGitHubLinkRequest formats mock link body", () => {
    const req = adaptMockGitHubLinkRequest(" alexmercer ");
    expect(req).toEqual({
      githubUsername: "alexmercer",
    });
  });
});
