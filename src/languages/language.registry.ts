import type { LanguageDefinition } from './language.types';
import { JAVASCRIPT_LANGUAGE_CONFIG } from './javascript/javascript.config';

class LanguageRegistry {
  private languages: Map<string, LanguageDefinition> = new Map();

  constructor() {
    this.register(JAVASCRIPT_LANGUAGE_CONFIG);
  }

  public register(language: LanguageDefinition): void {
    this.languages.set(language.id, language);
  }

  public get(id: string): LanguageDefinition | undefined {
    return this.languages.get(id);
  }

  public getAll(): LanguageDefinition[] {
    return Array.from(this.languages.values());
  }

  public getDefault(): LanguageDefinition {
    const defaultLang = this.languages.get('javascript');
    if (!defaultLang) {
      throw new Error('Default language "javascript" is not registered.');
    }
    return defaultLang;
  }
}

export const languageRegistry = new LanguageRegistry();
