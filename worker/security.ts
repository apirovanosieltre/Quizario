/** Abuse protection, Turnstile validation, and stateless one-use-on-change reset links.
 * The token signature depends on the current password hash, so changing the password
 * revokes every previously issued reset link without another permanent D1 table.
 */
export interface SecurityEnv {
  AUTH_RATE: RateLimit;
  QUIZ_RATE: RateLimit;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_HOSTNAMES?: string;
  PASSWORD_RESET_SECRET?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  PUBLIC_BASE_URL?: string;
}

export class SecurityError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const RESET_LIFETIME_MS = 30 * 60 * 1000;
const RATE_LIMIT_MESSAGE = 'Troppi tentativi. Riprova tra qualche minuto.';

function b64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
function fromB64url(text: string): Uint8Array {
  if (!/^[a-zA-Z0-9_-]+$/.test(text)) throw new SecurityError(400, 'Link non valido o scaduto.');
  try {
    const raw = atob(text.replaceAll('-','+').replaceAll('_','/'));
    return Uint8Array.from(raw, ch => ch.charCodeAt(0));
  } catch { throw new SecurityError(400, 'Link non valido o scaduto.'); }
}
function safeEqual(a: Uint8Array, b: Uint8Array): boolean {
  let delta = a.length ^ b.length;
  for (let i=0; i<Math.max(a.length,b.length); i++) delta |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return delta === 0;
}
async function hexDigest(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value)));
  return Array.from(bytes, x=>x.toString(16).padStart(2,'0')).join('');
}

/** Cloudflare-native limiter does not write D1. Limits are approximate per POP. */
export async function enforceRateLimit(env: SecurityEnv, request: Request, group: 'auth'|'quiz', email?: string): Promise<void> {
  const limiter = group==='auth' ? env.AUTH_RATE : env.QUIZ_RATE;
  // Missing binding must not silently disable protection in deployed Workers.
  if (!limiter || typeof limiter.limit !== 'function') throw new SecurityError(503, 'Protezione temporaneamente non disponibile.');
  const ip = request.headers.get('cf-connecting-ip')?.trim() || 'unknown';
  const scopedIp = (await hexDigest(ip)).slice(0,32);
  const key = `${group}:${scopedIp}`;
  if (!(await limiter.limit({key})).success) throw new SecurityError(429, RATE_LIMIT_MESSAGE);
  if (email) {
    // Protect an account across different IPs; no email is saved in rate-limit keys.
    const accountKey = `email:${(await hexDigest(email.trim().toLowerCase())).slice(0,32)}`;
    if (!(await limiter.limit({key:accountKey})).success) throw new SecurityError(429, RATE_LIMIT_MESSAGE);
  }
}

export function turnstileReady(env: SecurityEnv): boolean {
  return Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && allowedHosts(env).length);
}
function allowedHosts(env: SecurityEnv): string[] {
  return (env.TURNSTILE_HOSTNAMES ?? '').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
}
export function passwordResetReady(env: SecurityEnv): boolean {
  if (!turnstileReady(env)) return false;
  if (!env.PASSWORD_RESET_SECRET || env.PASSWORD_RESET_SECRET.length<32 || !env.RESEND_API_KEY || !env.MAIL_FROM || !env.PUBLIC_BASE_URL) return false;
  try {
    const base = new URL(env.PUBLIC_BASE_URL);
    return base.protocol==='https:' && base.username==='' && base.password==='' && base.pathname==='/' && base.search==='' && base.hash==='';
  } catch {return false;}
}

/** Never trust a browser-only captcha: the Worker verifies and checks action/hostname. */
export async function verifyTurnstile(env: SecurityEnv, request: Request, token: unknown, action: 'register'|'recover'): Promise<void> {
  if (!turnstileReady(env)) throw new SecurityError(503, 'Registrazione e recupero account temporaneamente non disponibili.');
  if (typeof token!=='string' || token.length<1 || token.length>2048) throw new SecurityError(400, 'Completa il controllo anti-bot.');
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (!allowedHosts(env).includes(hostname)) throw new SecurityError(403, 'Dominio non autorizzato.');
  let result: {success?:boolean;action?:string;hostname?:string};
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({
        secret:env.TURNSTILE_SECRET_KEY!, response:token,
        ...(request.headers.get('cf-connecting-ip') ? {remoteip:request.headers.get('cf-connecting-ip')!} : {}),
      }),
      signal:AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('turnstile-unavailable');
    result = await response.json() as typeof result;
  } catch {throw new SecurityError(503, 'Verifica anti-bot temporaneamente non disponibile.');}
  if (!result.success || result.action!==action || result.hostname?.toLowerCase()!==hostname) {
    throw new SecurityError(403, 'Controllo anti-bot non superato. Riprova.');
  }
}

interface ResetPayload { v:1; uid:string; exp:number; nonce:string; }
interface ResetUser { id:string; password_hash:string; }
async function signature(secret: string, passwordHash:string, payload:string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(`${payload}.${passwordHash}`)));
}
export async function createResetToken(secret:string,user:ResetUser,now=Date.now()):Promise<string> {
  if(secret.length<32)throw new SecurityError(503,'Recupero password non configurato.');
  const payload:ResetPayload={v:1,uid:user.id,exp:now+RESET_LIFETIME_MS,nonce:crypto.randomUUID()};
  const body=b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${b64url(await signature(secret,user.password_hash,body))}`;
}
/** Returns the user id only for a valid unexpired token signed against current password hash. */
export async function verifyResetToken(secret:string,token:unknown, getUser:(id:string)=>Promise<ResetUser|null>,now=Date.now()):Promise<string|null>{
  if(secret.length<32||typeof token!=='string'||token.length>600||token.length<50)return null;
  const parts=token.split('.'); if(parts.length!==2)return null;
  let decoded:ResetPayload;
  try {decoded=JSON.parse(dec.decode(fromB64url(parts[0]))) as ResetPayload;}catch{return null;}
  if(decoded.v!==1 ||typeof decoded.uid!=='string'|| !/^[a-zA-Z0-9-]{12,64}$/.test(decoded.uid)
   ||typeof decoded.exp!=='number'||!Number.isFinite(decoded.exp)||decoded.exp<=now||decoded.exp>now+RESET_LIFETIME_MS
   ||typeof decoded.nonce!=='string'||!/^[a-zA-Z0-9-]{16,64}$/.test(decoded.nonce))return null;
  const user=await getUser(decoded.uid);
  if(!user)return null;
  let provided:Uint8Array;
  try{provided=fromB64url(parts[1]);}catch{return null;}
  const expected=await signature(secret,user.password_hash,parts[0]);
  return safeEqual(provided,expected)?user.id:null;
}

/** Resend is optional infrastructure and is not used until configured with a verified sender domain. */
export async function sendResetEmail(env:SecurityEnv,to:string,token:string):Promise<void>{
  if(!passwordResetReady(env))throw new SecurityError(503,'Recupero password temporaneamente non disponibile.');
  const url=new URL('/reset-password',env.PUBLIC_BASE_URL!);
  // Fragment keeps the reset secret out of HTTP server logs and Referer URLs.
  url.hash='token='+encodeURIComponent(token);
  const email=await fetch('https://api.resend.com/emails',{
    method:'POST',
    headers:{'authorization':`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},
    body:JSON.stringify({
      from:env.MAIL_FROM,to:[to],subject:'Quizario · Reimposta la tua password',
      text:`Hai richiesto il recupero della password Quizario. Apri questo link entro 30 minuti:\n\n${url.toString()}\n\nSe non sei stato tu, ignora questo messaggio.`,
    }),
    signal:AbortSignal.timeout(10000),
  });
  if(!email.ok)throw new Error('Email provider unavailable');
}