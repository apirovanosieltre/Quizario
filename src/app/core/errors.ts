import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (typeof error.error?.error === 'string') return error.error.error;
    if (error.status === 0) return 'Server non raggiungibile. Avvia anche il Worker locale.';
  }
  return 'Errore temporaneo. Riprova tra poco.';
}
