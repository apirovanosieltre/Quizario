import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Quizario · Home', loadComponent: () => import('./pages/home').then(m => m.HomePage) },
  { path: 'quiz/:slug', title: 'Quiz · Quizario', loadComponent: () => import('./pages/quiz').then(m => m.QuizPage) },
  { path: 'login', title: 'Accedi · Quizario', loadComponent: () => import('./pages/login').then(m => m.LoginPage) },
  { path: 'register', title: 'Registrati · Quizario', loadComponent: () => import('./pages/register').then(m => m.RegisterPage) },
  { path: 'account', title: 'Il mio profilo · Quizario', loadComponent: () => import('./pages/account').then(m => m.AccountPage) },
  { path: 'admin', title: 'Revisione domande · Quizario', loadComponent: () => import('./pages/admin').then(m => m.AdminPage) },
  { path: 'privacy', title: 'Privacy · Quizario', loadComponent: () => import('./pages/privacy').then(m => m.PrivacyPage) },
  { path: '**', title: 'Pagina non trovata · Quizario', loadComponent: () => import('./pages/not-found').then(m => m.NotFoundPage) },
];
