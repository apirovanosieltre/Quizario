import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="site-header">
        <div class="container header-inner">
          <a class="brand" routerLink="/" aria-label="Quizario, torna alla home">
            <span class="brand-mark" aria-hidden="true">Q<span class="brand-dot">.</span></span>
            <span>quizario<span class="brand-spark">✳</span></span>
          </a>
          <nav class="desktop-nav" aria-label="Navigazione principale">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Scopri</a>
            <a routerLink="/quiz/daily" routerLinkActive="active">Quiz del giorno</a>
            <a routerLink="/account" routerLinkActive="active">Il mio profilo</a>
          </nav>
          <a class="header-account" [routerLink]="auth.user() ? '/account' : '/login'">
            <span class="header-avatar" aria-hidden="true">{{ auth.user()?.nickname?.charAt(0)?.toUpperCase() || '☺' }}</span>
            <span>{{ auth.user()?.nickname || 'Accedi' }}</span>
          </a>
        </div>
      </header>
      <main id="main-content" class="main-content"><router-outlet /></main>
      <footer class="site-footer">
        <div class="container footer-inner"><span>© {{ year }} Quizario · Versione iniziale</span>
          <span><a routerLink="/privacy">Privacy</a> · <a routerLink="/account">Account</a></span>
        </div>
      </footer>
      <nav class="mobile-nav" aria-label="Navigazione mobile">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><span aria-hidden="true">⌂</span>Scopri</a>
        <a routerLink="/quiz/daily" routerLinkActive="active"><span aria-hidden="true">◈</span>Quiz</a>
        <a routerLink="/account" routerLinkActive="active"><span aria-hidden="true">◉</span>Profilo</a>
      </nav>
    </div>
  `,
})
export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly year = new Date().getFullYear();
  ngOnInit(): void { void this.auth.bootstrap(); }
}
