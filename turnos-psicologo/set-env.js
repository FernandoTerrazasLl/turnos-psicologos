/**
 * Script para inyectar variables de entorno en los archivos environment de Angular.
 * Se ejecuta ANTES de ng build en el deploy de Vercel.
 *
 * Uso: node set-env.js
 *
 * Requiere que las variables SUPABASE_URL y SUPABASE_KEY estén definidas
 * como Environment Variables en el proyecto de Vercel.
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

console.log('=== Inyectando variables de entorno ===');
console.log(`SUPABASE_URL: ${SUPABASE_URL ? '✅ definida' : '⚠️ vacía'}`);
console.log(`SUPABASE_KEY: ${SUPABASE_KEY ? '✅ definida' : '⚠️ vacía'}`);

const envProdContent = `export const environment = {
  production: true,
  supabase: {
    url: '${SUPABASE_URL}',
    key: '${SUPABASE_KEY}'
  }
};
`;

const envDevContent = `export const environment = {
  production: false,
  supabase: {
    url: '${SUPABASE_URL}',
    key: '${SUPABASE_KEY}'
  }
};
`;

const prodPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
const devPath = path.join(__dirname, 'src', 'environments', 'environment.ts');

fs.writeFileSync(prodPath, envProdContent, 'utf-8');
console.log(`✅ Escrito: ${prodPath}`);

fs.writeFileSync(devPath, envDevContent, 'utf-8');
console.log(`✅ Escrito: ${devPath}`);

console.log('=== Variables de entorno inyectadas correctamente ===');
