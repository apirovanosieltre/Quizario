import { Injectable, computed, signal } from '@angular/core';

export interface QuizAttempt {
  slug: string;
  date: string;
  correct: number;
  total: number;
  durationSeconds: number;
}
const STORAGE_KEY = 'quizario:quiz-attempts:v2';

function readLocal(): QuizAttempt[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter(item =>
      typeof item?.slug === 'string' && typeof item?.date === 'string' &&
      typeof item?.correct === 'number' && typeof item?.total === 'number' &&
      typeof item?.durationSeconds === 'number'
    ).slice(-100) : [];
  } catch { return []; }
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  readonly attempts = signal<QuizAttempt[]>(readLocal());
  readonly completed = computed(() => this.attempts().length);
  readonly average = computed(() => {
    const entries = this.attempts();
    const total = entries.reduce((sum, item) => sum + item.total, 0);
    return total ? Math.round(100 * entries.reduce((sum, item) => sum + item.correct, 0) / total) : 0;
  });

  save(attempt: QuizAttempt): void {
    const updated = [...this.attempts(), attempt].slice(-100);
    this.attempts.set(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* Storage blocked; session still works */ }
  }
}
