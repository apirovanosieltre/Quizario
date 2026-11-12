import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AccountUser { id: string; nickname: string; email: string; createdAt: string; }
interface UserResponse { user: AccountUser; }
export interface SecurityConfig { turnstileSiteKey:string|null; registrationEnabled:boolean; passwordResetEnabled:boolean; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly user = signal<AccountUser | null>(null);
  readonly loading = signal(true);

  async bootstrap(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<UserResponse>('/api/auth/me'));
      this.user.set(response.user);
    } catch {
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.http.post<UserResponse>('/api/auth/login', { email, password }));
    this.user.set(response.user);
  }

  async register(nickname: string, email: string, password: string, turnstileToken: string): Promise<void> {
    const response = await firstValueFrom(this.http.post<UserResponse>('/api/auth/register', { nickname, email, password, turnstileToken }));
    this.user.set(response.user);
  }

  async securityConfig():Promise<SecurityConfig> {
    return firstValueFrom(this.http.get<SecurityConfig>('/api/security/config'));
  }

  async requestPasswordReset(email:string,turnstileToken:string):Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/password/forgot',{email,turnstileToken}));
  }

  async resetPassword(token:string,password:string):Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/password/reset',{token,password}));
    this.user.set(null);
  }

  async changeNickname(nickname: string): Promise<void> {
    const response = await firstValueFrom(this.http.patch<UserResponse>('/api/account', { nickname }));
    this.user.set(response.user);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post('/api/auth/logout', {}));
    this.user.set(null);
  }

  async deleteAccount(): Promise<void> {
    await firstValueFrom(this.http.delete('/api/account'));
    this.user.set(null);
  }
}