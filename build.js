const fs = require('fs');
const path = require('path');

// Leer .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró el archivo .env');
  console.error('   Copiá .env.example a .env y completá tus keys');
  process.exit(1);
}

const env = {};
fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });

// Leer index.html
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Verificar que el placeholder esté presente
if (!html.includes('__OWM_KEY__')) {
  console.warn('⚠️  Placeholder __OWM_KEY__ no encontrado en index.html');
  console.warn('   Quizás ya fue reemplazado. Regenerá desde el template.');
} else {
  const owmKey = env.OWM_KEY;
  if (!owmKey || owmKey === 'tu_api_key_de_openweathermap') {
    console.error('❌ OWM_KEY no configurada en .env');
    process.exit(1);
  }
  html = html.replace(/__OWM_KEY__/g, owmKey);
  console.log('✅ OWM_KEY inyectada');
}

// Escribir dist/index.html
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

fs.copyFileSync(path.join(__dirname, 'manifest.json'), path.join(distDir, 'manifest.json'));
fs.copyFileSync(path.join(__dirname, 'sw.js'), path.join(distDir, 'sw.js'));
fs.writeFileSync(path.join(distDir, 'index.html'), html, 'utf8');

console.log('✅ Build generado en /dist — listo para deployar');
