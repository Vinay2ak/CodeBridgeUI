import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  Mail,
  Github,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Briefcase,
  Settings,
  Bell,
  Cpu,
  Shield,
  Save,
  Plus,
  X,
  Code2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { profileApi } from "../../services/profile/api";
import type { FreelancerProfileData } from "../../services/profile/types";
import type { User } from "../../session/session";
import { sessionStore } from "../../session/session";
import { Button } from "../../components/ui/Button";

interface VerifiedPortfolioViewProps {
  user?: User;
  onNavigateToRadar?: () => void;
}

export const VerifiedPortfolioView: React.FC<VerifiedPortfolioViewProps> = ({
  user,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "settings">("profile");
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New skill input state
  const [newSkillInput, setNewSkillInput] = useState("");

  // Query for developer profile details
  const { data: profile } = useQuery<FreelancerProfileData>({
    queryKey: ["freelancer", "full-profile"],
    queryFn: () => profileApi.getFreelancerProfile(user),
    staleTime: 60_000,
  });

  // Local form state for editing details and settings
  const [formData, setFormData] = useState<FreelancerProfileData | null>(null);

  // Initialize form state once profile loads
  React.useEffect(() => {
    if (profile && !formData) {
      setFormData(profile);
    }
  }, [profile, formData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateMutation = useMutation({
    mutationFn: (updated: Partial<FreelancerProfileData>) =>
      profileApi.updateFreelancerProfile(updated),
    onSuccess: (saved) => {
      setFormData(saved);
      queryClient.setQueryData(["freelancer", "full-profile"], saved);
      queryClient.invalidateQueries({ queryKey: ["freelancer", "skills"] });
      showToast("Profile & Settings saved successfully!");
    },
  });

  const handleCopyId = () => {
    const idToCopy = user?.id || "usr_freelancer_cb";
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    showToast("Developer ID copied to clipboard!");
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed || !formData) return;
    if (formData.skills.includes(trimmed)) {
      setNewSkillInput("");
      return;
    }
    const updatedSkills = [...formData.skills, trimmed];
    setFormData({ ...formData, skills: updatedSkills });
    setNewSkillInput("");
    updateMutation.mutate({ skills: updatedSkills });
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!formData) return;
    const updatedSkills = formData.skills.filter((s) => s !== skillToRemove);
    setFormData({ ...formData, skills: updatedSkills });
    updateMutation.mutate({ skills: updatedSkills });
  };

  const handleSaveAll = () => {
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  const currentData = formData || profile;

  return (
    <div className="flex-1 overflow-y-auto bg-canvas p-4 sm:p-6 lg:p-8 space-y-6 text-ink">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-surface text-ink shadow-2xl flex items-center gap-3 border border-line animate-in fade-in slide-in-from-bottom-4 duration-200">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Top Header Card: Developer Identity Overview */}
        <div className="p-6 sm:p-8 rounded-2xl border border-line bg-surface shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-info-bg border border-info-border text-primary flex items-center justify-center font-bold text-2xl sm:text-3xl shrink-0">
                {(currentData?.displayName || user?.displayName || "D")[0]?.toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                    {currentData?.displayName || user?.displayName || "Developer"}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-bg text-success border border-success-border uppercase">
                    <Check className="h-3 w-3" />
                    <span>Verified Developer</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-primary font-medium">
                  {currentData?.headline || "Software Engineer & Systems Specialist"}
                </p>

                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{user?.email || currentData?.email || "developer@codebridge.dev"}</span>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Member since 2026</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="flex items-center gap-1 font-mono hover:text-ink transition-colors"
                    title="Click to copy Developer UUID"
                  >
                    <span>ID: {(user?.id || "cb-usr-9102").slice(0, 12)}...</span>
                    {copiedId ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Availability Status Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <span className="text-xs font-medium text-muted">Availability</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-canvas text-xs font-semibold text-ink">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span>
                  {currentData?.availability === "AVAILABLE"
                    ? "Available for Tasks"
                    : currentData?.availability === "OPEN_TO_OFFERS"
                    ? "Open to Offers"
                    : "Busy"}
                </span>
              </div>
            </div>
          </div>

          {/* Section Navigation Tabs: Developer Details vs Settings */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-line">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "profile"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-ink hover:bg-raised"
              }`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Developer Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settings"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-muted hover:text-ink hover:bg-raised"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Settings & Preferences</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Developer Details */}
        {activeTab === "profile" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Bio & Professional Summary */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>About & Experience</span>
                </h2>
                <span className="text-xs text-muted font-medium">
                  {currentData?.experienceYears || 5}+ Years Experience
                </span>
              </div>

              <p className="text-sm text-ink leading-relaxed">
                {currentData?.bio ||
                  "Software engineer specialized in building deterministic backend architectures, containerized microservices, and end-to-end modern web applications."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-1">
                  <span className="text-[11px] font-medium text-muted block">Primary Role</span>
                  <span className="text-xs font-bold text-ink block">Full-Stack Engineer</span>
                </div>

                <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-1">
                  <span className="text-[11px] font-medium text-muted block">Contract Type</span>
                  <span className="text-xs font-bold text-ink block">Escrow Milestone Driven</span>
                </div>

                <div className="p-3.5 rounded-xl bg-canvas border border-line space-y-1">
                  <span className="text-[11px] font-medium text-muted block">GitHub Profile</span>
                  <a
                    href={`https://github.com/${currentData?.githubUsername || "codebridge-dev"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span>@{currentData?.githubUsername || "codebridge-dev"}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Skills & Technologies Matrix */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-warning" />
                  <span>Technical Skills & Stacks</span>
                </h2>
                <span className="text-xs text-muted font-mono">
                  {currentData?.skills.length || 0} Skills Configured
                </span>
              </div>

              {/* Skill Badges */}
              <div className="flex flex-wrap gap-2.5">
                {(currentData?.skills || []).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-canvas border border-line text-ink group hover:border-primary/50 transition-colors"
                  >
                    <Code2 className="h-3 w-3 text-primary" />
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      className="ml-0.5 p-0.5 rounded text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Skill Input */}
              <form onSubmit={handleAddSkill} className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add a new skill (e.g. Next.js, Redis, Golang)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-canvas border border-line text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="text-xs h-9"
                  disabled={!newSkillInput.trim()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>Add Skill</span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Settings & Preferences */}
        {activeTab === "settings" && currentData && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Edit Profile Form */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-5 shadow-sm">
              <div className="pb-3 border-b border-line flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <span>Profile Details Settings</span>
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Update your public developer identity and professional bio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={currentData.displayName}
                    onChange={(e) =>
                      setFormData({ ...currentData, displayName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-canvas border border-line text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink block">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    value={currentData.headline}
                    onChange={(e) =>
                      setFormData({ ...currentData, headline: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-canvas border border-line text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink block">
                    GitHub Handle
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 text-xs bg-canvas border border-r-0 border-line text-muted rounded-l-xl">
                      github.com/
                    </span>
                    <input
                      type="text"
                      value={currentData.githubUsername}
                      onChange={(e) =>
                        setFormData({ ...currentData, githubUsername: e.target.value })
                      }
                      className="flex-1 px-3.5 py-2 text-xs rounded-r-xl bg-canvas border border-line text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink block">
                    Availability Status
                  </label>
                  <select
                    value={currentData.availability}
                    onChange={(e) =>
                      setFormData({
                        ...currentData,
                        availability: e.target.value as any,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-canvas border border-line text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="AVAILABLE">Available for Tasks</option>
                    <option value="OPEN_TO_OFFERS">Open to Offers</option>
                    <option value="BUSY">Busy / Not Taking Tasks</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-ink block">
                    Bio & Summary
                  </label>
                  <textarea
                    rows={3}
                    value={currentData.bio}
                    onChange={(e) =>
                      setFormData({ ...currentData, bio: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-canvas border border-line text-ink focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-4 shadow-sm">
              <div className="pb-3 border-b border-line">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span>Notification Preferences</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Control the automated alerts sent to your email and workspace.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-line">
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      New Matching Tasks in Radar
                    </span>
                    <span className="text-[11px] text-muted block">
                      Receive notifications when new scopes match your proven tech stack.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentData.notifications.newMatchingTasks}
                    onChange={(e) =>
                      setFormData({
                        ...currentData,
                        notifications: {
                          ...currentData.notifications,
                          newMatchingTasks: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-line">
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Escrow Deposit & Payout Alerts
                    </span>
                    <span className="text-[11px] text-muted block">
                      Instant alerts when client funds lock or clear to your account.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentData.notifications.escrowUpdates}
                    onChange={(e) =>
                      setFormData({
                        ...currentData,
                        notifications: {
                          ...currentData.notifications,
                          escrowUpdates: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-line">
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Automated Test-Gate Results
                    </span>
                    <span className="text-[11px] text-muted block">
                      Receive pass/fail logs when your container submission checks run.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentData.notifications.testGateResults}
                    onChange={(e) =>
                      setFormData({
                        ...currentData,
                        notifications: {
                          ...currentData.notifications,
                          testGateResults: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Workspace & Container Settings */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-4 shadow-sm">
              <div className="pb-3 border-b border-line">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span>Workspace & Docker Settings</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Configure default runtime container settings for the Controlled Workspace.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-ink block">
                    Default Runner Image
                  </label>
                  <select
                    value={currentData.workspaceSettings.defaultImage}
                    onChange={(e) =>
                      setFormData({
                        ...currentData,
                        workspaceSettings: {
                          ...currentData.workspaceSettings,
                          defaultImage: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-canvas border border-line text-ink font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="codebridge/runner:python3.11">codebridge/runner:python3.11</option>
                    <option value="codebridge/runner:node20">codebridge/runner:node20</option>
                    <option value="codebridge/runner:latest">codebridge/runner:latest (Polyglot)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-line">
                  <div>
                    <span className="text-xs font-bold text-ink block">
                      Auto-Run Test Gate on Save
                    </span>
                    <span className="text-[11px] text-muted block">
                      Automatically execute test suite runner when solution changes are saved.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentData.workspaceSettings.autoRunTests}
                    onChange={(e) =>
                      setFormData({
                        ...currentData,
                        workspaceSettings: {
                          ...currentData.workspaceSettings,
                          autoRunTests: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Security & Session Actions */}
            <div className="p-6 rounded-2xl border border-line bg-surface space-y-4 shadow-sm">
              <div className="pb-3 border-b border-line">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Security & Account Session</span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Session credentials and authentication state.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-canvas border border-line">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-ink block">Active Session</span>
                  <span className="text-[11px] text-muted block">
                    Signed in as {user?.email || "developer@codebridge.dev"} with JWT Bearer token.
                  </span>
                </div>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => sessionStore.logout()}
                  className="text-xs shrink-0"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            {/* Save Settings Button */}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={updateMutation.isPending}
                className="text-xs px-6 py-2.5 font-bold shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                <span>{updateMutation.isPending ? "Saving..." : "Save Settings"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
