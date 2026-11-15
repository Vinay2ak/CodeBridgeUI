import React, { useState } from 'react';
import { Bell, Shield, Sliders, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Panel } from '../../../components/dashboard/Panel';
import { useToast } from '../../../components/ui/Toast';

export const SettingsPanel: React.FC = () => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Settings State
  const [autoReleaseDays, setAutoReleaseDays] = useState('7');
  const [requireCiPass, setRequireCiPass] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [realtimeAlerts, setRealtimeAlerts] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://ci.codebridge.internal/hooks/deliveries');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      addToast({
        title: 'Settings Saved',
        description: 'Your project owner preferences have been updated successfully.',
        type: 'success',
      });
    }, 400);
  };

  return (
    <Panel
      id="settings"
      title="Settings & Preferences"
      serviceName="identity service"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-6 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project & Escrow Automation */}
          <div className="p-4 rounded-lg bg-surface-raised/40 border border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text pb-2 border-b border-border">
              <Sliders className="w-4 h-4 text-primary" />
              <span>Escrow & Deliverable Policies</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Auto-Release Review Period (Days)
              </label>
              <select
                value={autoReleaseDays}
                onChange={(e) => setAutoReleaseDays(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface border border-border text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="3">3 Days (Fast track)</option>
                <option value="7">7 Days (Standard)</option>
                <option value="14">14 Days (Extended review)</option>
              </select>
              <p className="text-[11px] text-text-muted mt-1">
                Time after developer submission before escrow funds are disbursed.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-medium text-text block">
                  Enforce CI Pass Before Review
                </span>
                <span className="text-[11px] text-text-muted">
                  Block approval until automated tests pass
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireCiPass}
                onChange={(e) => setRequireCiPass(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Notifications & Integrations */}
          <div className="p-4 rounded-lg bg-surface-raised/40 border border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text pb-2 border-b border-border">
              <Bell className="w-4 h-4 text-primary" />
              <span>Notifications & Webhooks</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Webhook Delivery Endpoint
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full font-mono px-3 py-2 rounded-md bg-surface border border-border text-xs text-text focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-text block">
                    Realtime Event Notifications
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Display toast popups for milestone releases
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={realtimeAlerts}
                  onChange={(e) => setRealtimeAlerts(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-text block">
                    Email Digests
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Receive daily project updates
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Shield className="w-3.5 h-3.5 text-success" />
            <span>Settings apply across all owned CodeBridge workspaces</span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSaving}
            className="font-semibold"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </form>
    </Panel>
  );
};
