import { runMaintenance } from './maintenance';
import { quizApi, QuizError } from './questions';
import { enforceRateLimit, turnstileReady, passwordResetReady, verifyTurnstile, createResetToken, verifyResetToken, sendResetEmail, SecurityError, type SecurityEnv } from './security';
/** Cloudflare Worker: REST API for accounts + static Angular assets. */
interface Env extends SecurityEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_EMAILS?: string;
  RATING_PEPPER?: string;
}

interface UserRow {
  id: string;
  nickname: string;
  email: string;
  created_at: string;
  password_hash: string;
  password_salt: string;
  password_iterations: number;
}
interface SessionRow { id: string; user_id: string; }

class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

const COOKIE_NAME = '__Host-quizario_session';
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 30;
const PBKDF2_ITERATIONS = 210_000;
const encoder = new TextEncoder();

function json(data: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'x-frame-options': 'DENY',
  });
  if (cookie) headers.set('set-cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

function asUser(row: UserRow) {
  return { id: row.id, nickname: row.nickname, email: row.email, createdAt: row.created_at };
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, letter => letter.charCodeAt(0));
}

async function hashPassword(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' }, key, 256);
  return encodeBase64(new Uint8Array(bits));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return difference === 0;
}

async function verifyPassword(password: string, user: UserRow): Promise<boolean> {
  const candidate = await hashPassword(password, decodeBase64(user.password_salt), user.password_iterations);
  return constantTimeEqual(decodeBase64(candidate), decodeBase64(user.password_hash));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

function createCookie(value: string, maxAge = SESSION_AGE_SECONDS): string {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

function getCookie(request: Request): string | null {
  const cookies = request.headers.get('cookie') ?? '';
  const entry = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  const token = entry?.slice(COOKIE_NAME.length + 1) ?? '';
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    throw new ApiError(415, 'Invia una richiesta JSON.');
  }
  const body = await request.text();
  if (body.length > 8192) throw new ApiError(413, 'Richiesta troppo grande.');
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch { /* handled below */ }
  throw new ApiError(400, 'Dati non validi.');
}

function checkOrigin(request: Request): void {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return;
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // Angular dev-server forwards /api to :8787. Production remains strict same-origin.
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const allowedDev = local && ['http://localhost:4200', 'http://127.0.0.1:4200'].includes(origin ?? '');
  if (!origin || (origin !== url.origin && !allowedDev)) throw new ApiError(403, 'Origine della richiesta non consentita.');
}

function checkNickname(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(400, 'Nickname non valido.');
  const nickname = value.trim();
  if (nickname.length < 2 || nickname.length > 24 || !/^[\p{L}\p{N} _.-]+$/u.test(nickname)) {
    throw new ApiError(400, 'Nickname: 2–24 caratteri, senza simboli speciali.');
  }
  return nickname;
}

function checkEmail(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(400, 'Email non valida.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Email non valida.');
  return email;
}

function checkPassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128) throw new ApiError(400, 'La password deve avere 10–128 caratteri.');
  return value;
}

async function sessionUser(request: Request, env: Env): Promise<{ user: UserRow; session: SessionRow } | null> {
  const token = getCookie(request);
  if (!token) return null;
  const row = await env.DB.prepare(`
    SELECT s.id AS session_id, s.user_id AS session_user_id,
           u.id, u.nickname, u.email, u.created_at,
           u.password_hash, u.password_salt, u.password_iterations
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).bind(await sha256(token), new Date().toISOString()).first<UserRow & { session_id: string; session_user_id: string }>();
  return row ? { user: row, session: { id: row.session_id, user_id: row.session_user_id } } : null;
}

async function requireUser(request: Request, env: Env) {
  const found = await sessionUser(request, env);
  if (!found) throw new ApiError(401, 'Utente non autenticato.');
  return found;
}

async function issueSession(user: UserRow, env: Env, status = 200): Promise<Response> {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), number => number.toString(16).padStart(2, '0')).join('');
  const now = new Date();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), user.id, await sha256(token), new Date(now.getTime() + SESSION_AGE_SECONDS * 1000).toISOString(), now.toISOString()).run();
  return json({ user: asUser(user) }, status, createCookie(token));
}

async function api(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === '/api/health' && request.method === 'GET') return json({ ok: true, service: 'quizario' });
  checkOrigin(request);

  if (pathname === '/api/security/config' && request.method === 'GET') {
    return json({
      turnstileSiteKey: turnstileReady(env) ? env.TURNSTILE_SITE_KEY : null,
      registrationEnabled: turnstileReady(env),
      passwordResetEnabled: passwordResetReady(env),
    });
  }

  // Limits protect both DB usage and account endpoints. Missing bindings fail closed.
  if (pathname.startsWith('/api/quiz/') || pathname.startsWith('/api/admin/')) {
    await enforceRateLimit(env, request, 'quiz');
  } else if ((pathname.startsWith('/api/auth/') && request.method === 'POST') ||
             (pathname === '/api/account' && request.method !== 'GET')) {
    await enforceRateLimit(env, request, 'auth');
  }

  if (pathname.startsWith('/api/quiz/') || pathname.startsWith('/api/admin/')) {
    const session = await sessionUser(request, env);
    return quizApi(request, env, session ? {id:session.user.id, email:session.user.email} : null);
  }

  if (pathname === '/api/auth/register' && request.method === 'POST') {
    const body = await readBody(request);
    const nickname = checkNickname(body['nickname']);
    const email = checkEmail(body['email']);
    const password = checkPassword(body['password']);
    await enforceRateLimit(env, request, 'auth', email);
    await verifyTurnstile(env, request, body['turnstileToken'], 'register');
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) throw new ApiError(409, 'Questa email è già registrata.');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const now = new Date().toISOString();
    const user: UserRow = {
      id: crypto.randomUUID(), nickname, email, password_hash: await hashPassword(password, salt, PBKDF2_ITERATIONS),
      password_salt: encodeBase64(salt), password_iterations: PBKDF2_ITERATIONS, created_at: now,
    };
    try {
      await env.DB.prepare(`INSERT INTO users (id, nickname, email, password_hash, password_salt, password_iterations, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(user.id, nickname, email, user.password_hash, user.password_salt, user.password_iterations, now, now).run();
    } catch (error) {
      if (String(error).includes('UNIQUE')) throw new ApiError(409, 'Questa email è già registrata.');
      throw error;
    }
    return issueSession(user, env, 201);
  }

  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const body = await readBody(request);
    const email = checkEmail(body['email']);
    await enforceRateLimit(env, request, 'auth', email);
    if (typeof body['password'] !== 'string') throw new ApiError(400, 'Password mancante.');
    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
    if (!user || !(await verifyPassword(body['password'], user))) throw new ApiError(401, 'Email o password non corretti.');
    return issueSession(user, env);
  }

  if (pathname === '/api/auth/password/forgot' && request.method === 'POST') {
    if (!passwordResetReady(env)) throw new ApiError(503, 'Recupero password non configurato.');
    const body = await readBody(request);
    const email = checkEmail(body['email']);
    await enforceRateLimit(env, request, 'auth', email);
    await verifyTurnstile(env, request, body['turnstileToken'], 'recover');
    const user = await env.DB.prepare('SELECT id,password_hash FROM users WHERE email=?').bind(email)
      .first<Pick<UserRow,'id'|'password_hash'>>();
    if (user) {
      const token = await createResetToken(env.PASSWORD_RESET_SECRET!, user);
      try { await sendResetEmail(env, email, token); }
      catch { console.error('Password reset delivery failure'); }
    }
    // Never reveal whether this email is associated with an account.
    return json({ok:true, message:'Se l’indirizzo è registrato, riceverai le istruzioni via email.'});
  }

  if (pathname === '/api/auth/password/reset' && request.method === 'POST') {
    if (!passwordResetReady(env)) throw new ApiError(503, 'Recupero password non configurato.');
    const body = await readBody(request);
    const password = checkPassword(body['password']);
    let resetUser: Pick<UserRow,'id'|'password_hash'> | null = null;
    const uid = await verifyResetToken(env.PASSWORD_RESET_SECRET!, body['token'], async (id) => {
      resetUser = await env.DB.prepare('SELECT id,password_hash FROM users WHERE id=?').bind(id)
        .first<Pick<UserRow,'id'|'password_hash'>>();
      return resetUser;
    });
    if (!uid || !resetUser) throw new ApiError(400,'Link di recupero non valido o scaduto.');
    const oldHash: string = (resetUser as Pick<UserRow,'password_hash'>).password_hash;
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPassword(password, salt, PBKDF2_ITERATIONS);
    const results = await env.DB.batch([
      env.DB.prepare('UPDATE users SET password_hash=?, password_salt=?, password_iterations=?, updated_at=? WHERE id=? AND password_hash=?')
        .bind(hash, encodeBase64(salt), PBKDF2_ITERATIONS, new Date().toISOString(), uid, oldHash),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(uid),
    ]);
    if (results[0]?.meta?.changes !== 1) throw new ApiError(400,'Link già utilizzato. Richiedine uno nuovo.');
    return json({ok:true, message:'Password aggiornata. Accedi nuovamente.'}, 200, createCookie('',0));
  }

  if (pathname === '/api/auth/me' && request.method === 'GET') {
    const found = await requireUser(request, env);
    return json({ user: asUser(found.user) });
  }

  if (pathname === '/api/auth/logout' && request.method === 'POST') {
    const found = await sessionUser(request, env);
    if (found) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(found.session.id).run();
    return json({ ok: true }, 200, createCookie('', 0));
  }

  if (pathname === '/api/account/results' && request.method === 'GET') {
    const found = await requireUser(request, env);
    const results = await env.DB.prepare(`SELECT quiz_date,quiz_slug,score,total,duration_seconds,completed_at
      FROM quiz_results WHERE user_id=? ORDER BY quiz_date DESC,completed_at DESC LIMIT 30`)
      .bind(found.user.id).all();
    return json({ results: results.results ?? [] });
  }

  if (pathname === '/api/account' && request.method === 'PATCH') {
    const found = await requireUser(request, env);
    const body = await readBody(request);
    const nickname = checkNickname(body['nickname']);
    await env.DB.prepare('UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?')
      .bind(nickname, new Date().toISOString(), found.user.id).run();
    return json({ user: asUser({ ...found.user, nickname }) });
  }

  if (pathname === '/api/account' && request.method === 'DELETE') {
    const found = await requireUser(request, env);
    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(found.user.id).run();
    return json({ ok: true }, 200, createCookie('', 0));
  }

  return json({ error: 'Endpoint non trovato.' }, 404);
}

export default {
  scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runMaintenance(env.DB));
  },
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!new URL(request.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try { return await api(request, env); }
    catch (error) {
      if (error instanceof ApiError || error instanceof QuizError || error instanceof SecurityError) return json({ error: error.message }, error.status);
      // Avoid leaking SQL, credentials, or internal error details to clients.
      console.error('Internal API failure:', error instanceof Error ? error.name : 'unknown');
      return json({ error: 'Errore temporaneo del server.' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;