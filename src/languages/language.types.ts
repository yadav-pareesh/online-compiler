export interface LanguageCapabilities {
  asyncAwait: boolean;
  promises: boolean;
  domAccess: boolean;
  networkAccess: boolean;
  filesystem: boolean;
  npmModules: boolean;
  consoleMethods: string[];
  featuresDescription: string[];
}

export interface LanguageLimits {
  defaultTimeoutMs: number;
  maxOutputChars: number;
}

export interface LanguageSnippet {
  id: string;
  title: string;
  description: string;
  code: string;
}

export interface LanguageDefinition {
  id: string;
  name: string;
  extension: string;
  version: string;
  defaultCode: string;
  executionStrategy: 'browser-sandbox' | 'web-worker' | 'remote-container';
  capabilities: LanguageCapabilities;
  limits: LanguageLimits;
  snippets: LanguageSnippet[];
}
