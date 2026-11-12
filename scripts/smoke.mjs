import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const files = [
  'package.json', 'angular.json', 'wrangler.jsonc', 'ngsw-config.json',
  'src/main.ts', 'src/app/app.ts', 'src/app/app.routes.ts',
  'src/app/pages/home.ts', 'src/app/pages/quiz.ts',
  'src/app/pages/login.ts', 'src/app/pages/register.ts',
  'src/app/pages/account.ts', 'src/app/pages/privacy.ts',
  'worker/index.ts', 'migrations/0001_core.sql',
  'public/manifest.webmanifest', 'public/icons/icon-192.png', 'public/icons/icon-512.png',
];
for (const file of files) assert.ok(existsSync(file), `Manca ${file}`);
const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
const angular = JSON.parse(readFileSync('angular.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const worker = readFileSync('worker/index.ts', 'utf8');
assert.equal(manifest.lang, 'it-IT');
assert.ok(angular.projects.quizario);
assert.ok(pkg.dependencies['@angular/core']);
for (const endpoint of ['/api/auth/register','/api/auth/login','/api/auth/logout','/api/auth/me','/api/account']) assert.ok(worker.includes(endpoint));
console.log(`Smoke check superato: ${files.length} file chiave presenti.`);
