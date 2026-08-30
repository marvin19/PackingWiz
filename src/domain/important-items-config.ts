import type { ImportantItem } from '@/domain/important-item';

/** Reusable Important master configuration for one Packing Profile. */
export type ImportantItemsConfig = {
  items: ImportantItem[];
  isConfigured: boolean;
  isEnabled: boolean;
  promptDismissed: boolean;
  updatedAt?: string;
};

export const defaultImportantItemsConfig: ImportantItemsConfig = {
  items: [],
  isConfigured: false,
  isEnabled: false,
  promptDismissed: false,
};

export function isImportantFeatureActiveForConfig(config: ImportantItemsConfig): boolean {
  return config.isConfigured && config.isEnabled;
}

/** Master items eligible for new-trip injection when the profile Important feature is active. */
export function enabledImportantItemsFromConfig(config: ImportantItemsConfig): ImportantItem[] {
  if (!isImportantFeatureActiveForConfig(config)) {
    return [];
  }

  return config.items.filter((item) => item.enabled);
}

export function cloneImportantItemsConfig(config: ImportantItemsConfig): ImportantItemsConfig {
  return {
    ...config,
    items: config.items.map((item) => ({ ...item })),
  };
}
