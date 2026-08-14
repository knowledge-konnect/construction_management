// localStorage-backed repositories — simplified for MVP.

import type {
  Quotation,
  Template,
  CompanySettings,
  QuestionnaireRecord,
} from './models';
import { STORAGE_KEYS } from './constants';
import { DEFAULT_SETTINGS, defaultTemplates, defaultQuestionnaire } from './defaults';

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Corrupt data for ${key}`, e);
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    const msg =
      e instanceof DOMException && e.name === 'QuotaExceededError'
        ? 'Storage quota exceeded. Please export a backup and remove old quotations.'
        : 'Could not save data to this browser.';
    throw new Error(msg);
  }
}

export interface StorageScope {
  userId: string;
  companyId: string;
}

function draftKey(scope: StorageScope, documentId: string): string {
  return `sopan.quotation_draft.${scope.userId}.${scope.companyId}.${documentId}`;
}

function draftIndexKey(scope: StorageScope): string {
  return `sopan.quotation_index.${scope.userId}.${scope.companyId}`;
}

function sequenceKey(scope: StorageScope): string {
  return `sopan.quotationSequence.${scope.userId}.${scope.companyId}`;
}

function withDefaults(q: Quotation): Quotation {
  return q.questionnaire ? q : { ...q, questionnaire: defaultQuestionnaire() };
}

export const quotationRepo = {
  // Local drafts are a per-user, per-company recovery/autosave cache, NOT
  // the source of truth (Supabase is) — see src/services/document.service.ts.
  list(scope: StorageScope): Quotation[] {
    const ids = safeParse<string[]>(draftIndexKey(scope), []);
    const drafts: Quotation[] = [];
    for (const id of ids) {
      const q = safeParse<Quotation | null>(draftKey(scope, id), null);
      if (q) drafts.push(withDefaults(q));
    }
    return drafts;
  },
  get(scope: StorageScope, id: string): Quotation | null {
    const q = safeParse<Quotation | null>(draftKey(scope, id), null);
    return q ? withDefaults(q) : null;
  },
  save(scope: StorageScope, q: Quotation): void {
    safeWrite(draftKey(scope, q.id), q);
    const ids = safeParse<string[]>(draftIndexKey(scope), []);
    if (!ids.includes(q.id)) {
      safeWrite(draftIndexKey(scope), [...ids, q.id]);
    }
  },
  delete(scope: StorageScope, id: string): void {
    try {
      localStorage.removeItem(draftKey(scope, id));
    } catch {
      // best-effort — nothing to recover from a removeItem failure
    }
    const ids = safeParse<string[]>(draftIndexKey(scope), []);
    safeWrite(draftIndexKey(scope), ids.filter((x) => x !== id));
  },
  nextSequence(scope: StorageScope): number {
    const seq = safeParse<number>(sequenceKey(scope), 0);
    const next = seq + 1;
    safeWrite(sequenceKey(scope), next);
    return next;
  },
  peekSequence(scope: StorageScope): number {
    return safeParse<number>(sequenceKey(scope), 0);
  },
};

export const templateRepo = {
  list(): Template[] {
    const list = safeParse<Template[] | null>(STORAGE_KEYS.templates, null);
    if (list === null) {
      const seeded = defaultTemplates();
      safeWrite(STORAGE_KEYS.templates, seeded);
      return seeded;
    }
    return list;
  },
  get(id: string): Template | null {
    return this.list().find((t) => t.id === id) ?? null;
  },
};

export const settingsRepo = {
  get(): CompanySettings {
    const s = safeParse<CompanySettings | null>(STORAGE_KEYS.settings, null);
    if (!s) {
      safeWrite(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...s };
  },
  save(s: CompanySettings): void {
    safeWrite(STORAGE_KEYS.settings, s);
  },
};

export const questionnaireRepo = {
  list(): QuestionnaireRecord[] {
    return safeParse<QuestionnaireRecord[]>(STORAGE_KEYS.questionnaires, []);
  },
  get(id: string): QuestionnaireRecord | null {
    return this.list().find((q) => q.id === id) ?? null;
  },
  save(rec: QuestionnaireRecord): void {
    const list = this.list();
    const idx = list.findIndex((q) => q.id === rec.id);
    if (idx >= 0) list[idx] = rec;
    else list.push(rec);
    safeWrite(STORAGE_KEYS.questionnaires, list);
  },
  delete(id: string): void {
    safeWrite(STORAGE_KEYS.questionnaires, this.list().filter((q) => q.id !== id));
  },
};
