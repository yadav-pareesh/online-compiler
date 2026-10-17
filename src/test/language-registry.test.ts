import { describe, it, expect } from 'vitest';
import { languageRegistry } from '../languages/language.registry';
import { JAVASCRIPT_DEFAULT_CODE } from '../languages/javascript/javascript.config';

describe('Language Registry', () => {
  it('registers and retrieves JavaScript as the default language', () => {
    const lang = languageRegistry.getDefault();
    expect(lang).toBeDefined();
    expect(lang.id).toBe('javascript');
    expect(lang.name).toBe('JavaScript');
    expect(lang.extension).toBe('.js');
    expect(lang.executionStrategy).toBe('browser-sandbox');
  });

  it('exposes correct JavaScript capabilities', () => {
    const lang = languageRegistry.getDefault();
    expect(lang.capabilities.asyncAwait).toBe(true);
    expect(lang.capabilities.promises).toBe(true);
    expect(lang.capabilities.domAccess).toBe(false);
    expect(lang.capabilities.networkAccess).toBe(false);
    expect(lang.capabilities.consoleMethods).toContain('log');
    expect(lang.capabilities.consoleMethods).toContain('table');
  });

  it('provides the official initial sample code', () => {
    const lang = languageRegistry.getDefault();
    expect(lang.defaultCode).toBe(JAVASCRIPT_DEFAULT_CODE);
    expect(lang.defaultCode).toContain('const numbers = [10, 20, 30, 40];');
    expect(lang.defaultCode).toContain('console.log("JavaScript is ready!");');
  });

  it('contains multiple snippets for developer exploration', () => {
    const lang = languageRegistry.getDefault();
    expect(lang.snippets.length).toBeGreaterThanOrEqual(3);
    const snippetTitles = lang.snippets.map((s) => s.title);
    expect(snippetTitles).toContain('Array Operations');
    expect(snippetTitles).toContain('Promises & Async/Await');
  });
});
