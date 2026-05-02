const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) { console.error('No .env found'); process.exit(1); }

const env = {};
fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (!t || t.startsWith('#')) return;
  const eq = t.indexOf('=');
  if (eq < 0) return;
  env[t.slice(0,eq).trim()] = t.slice(eq+1).trim();
});

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// OWM
if (!html.includes('__OWM_KEY__')) {
  console.warn('[!] __OWM_KEY__ no encontrado');
} else {
  if (!env.OWM_KEY || env.OWM_KEY === 'tu_api_key_de_openweathermap') { console.error('OWM_KEY no configurada'); process.exit(1); }
  html = html.replace(/__OWM_KEY__/g, env.OWM_KEY);
  console.log('[OK] OWM_KEY inyectada');
}

// Firebase
const fbMap = [
  ['__FB_API_KEY__',             env.FB_API_KEY],
  ['__FB_AUTH_DOMAIN__',         env.FB_AUTH_DOMAIN],
  ['__FB_PROJECT_ID__',          env.FB_PROJECT_ID],
  ['__FB_STORAGE_BUCKET__',      env.FB_STORAGE_BUCKET],
  ['__FB_MESSAGING_SENDER_ID__', env.FB_MESSAGING_SENDER_ID],
  ['__FB_APP_ID__',              env.FB_APP_ID],
];
const fbOk = fbMap.every(([,v]) => v && !v.startsWith('TU_'));
if (!fbOk) {
  console.warn('[!] Firebase no configurado - completa las variables FB_* en .env');
} else {
  fbMap.forEach(([ph, val]) => { html = html.split(ph).join(val); });
  console.log('[OK] Firebase config inyectada');
}

// Escribir dist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(__dirname, 'sw.js'), path.join(distDir, 'sw.js'));
fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');
console.log('[OK] Build generado en /dist');
