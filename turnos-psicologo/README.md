# TurnosPsicologo

Guía rápida para ejecutar el proyecto localmente tras clonar desde GitHub.

## 1. Requisitos

- Node.js 20+ (recomendado) y npm 10+.
- Git.
- Cuenta Supabase + proyecto con tablas y roles configurados según la app.

## 2. Clonar el repositorio

```bash
git clone https://github.com/<tu-usuario>/turnos-psicologos.git
cd turnos-psicologo
```

## 3. Instalar dependencias

```bash
npm install
```

## 4. Correr en desarrollo

```bash
npm start
```

El servidor estará en `http://localhost:4200/`.

## 5. Compilar producción

```bash
npm run build
```

o con configuración de Vercel:

```bash
npm run vercel-build
```

## 6. Publicar en Vercel

- Ya no es necesario configurar variables de entorno en Vercel, ya que la conexión a Supabase está configurada directamente en el código de la aplicación.

## 7. Diagnóstico rápido

- `npm install` genera errores: actualiza Node/npm y elimina `node_modules` + `package-lock.json` y reinstala.
- `ng serve` no funciona: revisa la versión de Angular CLI (`npm install -g @angular/cli@20.3.2` si hace falta).

---

## 11. Recursos

- Angular CLI: https://angular.dev/guide/cli
- DayPilot Lite: https://www.daypilot.org/
- Supabase JS: https://supabase.com/docs/reference/javascript
