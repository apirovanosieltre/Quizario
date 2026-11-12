import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({ standalone: true, imports: [RouterLink], template: `
  <section class="container empty-state"><div class="eyebrow secondary">ERRORE 404</div><h1>Domanda difficile, pagina introvabile.</h1><p>Questo indirizzo non esiste.</p><a class="button button-primary" routerLink="/">Torna alla home ↗</a></section>
` })
export class NotFoundPage {}
