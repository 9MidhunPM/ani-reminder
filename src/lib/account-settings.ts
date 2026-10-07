import type { AccountSettings } from "./reminder-view";

export type AccountRecord = {
  email: string;
  morningEnabled: boolean;
  airtimeEnabled: boolean;
  ntfyTopic: string;
};

export const accountSettingsSelect = {
  email: true,
  morningEnabled: true,
  airtimeEnabled: true,
  ntfyTopic: true,
} as const;

/** Only this public projection may leave the server. The topic is a secret. */
export function serializeAccountSettings(account: AccountRecord): AccountSettings {
  return {
    email: account.email,
    morningEnabled: account.morningEnabled,
    airtimeEnabled: account.airtimeEnabled,
    topicConfigured: account.ntfyTopic.length > 0,
  };
}
