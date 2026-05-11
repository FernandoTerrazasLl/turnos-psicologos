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

## 7. Dependencias: Librería DayPilot (Componentes Prehechos)

Este proyecto usa **DayPilot Lite for Angular**, una librería externa que nos da el calendario ya hecho. En lugar de crear un calendario desde cero con HTML y CSS, usamos sus componentes listos para usar:

1. **`DayPilotCalendarComponent` (`<daypilot-calendar>`)**:
   - **Qué es**: Es la grilla principal de la semana (donde ves los días y las horas de 08:00 a 20:00).
   - **Qué hace**: Permite hacer clics, arrastrar el mouse para crear rangos vacíos (que luego abren nuestro formulario de crear turno), y mover/alargar cajitas de turnos visualmente.

2. **`DayPilotNavigatorComponent` (`<daypilot-navigator>`)**:
   - **Qué es**: Es el mini-calendario que está en la barra lateral izquierda (Sidebar).
   - **Qué hace**: Sirve únicamente para seleccionar fechas rápidas. Al hacer clic en un día del mini-calendario, le decimos al calendario principal (la grilla grande) que salte a esa semana para ver los turnos.

3. **`DayPilot.Modal`**:
   - **Qué es**: Es un generador de "Popups" (ventanitas flotantes).
   - **Qué hace**: Lo usamos para dos cosas:
     - Dibujar el formulario para rellenar los datos del paciente (nombre, apellido, etc.) sin tener que programar el HTML del formulario a mano.
     - Mostrar ventanitas de alerta ("Este horario está ocupado", "Turno borrado", etc.).

## 8. Diagnóstico rápido

- `npm install` genera errores: actualiza Node/npm y elimina `node_modules` + `package-lock.json` y reinstala.
- `ng serve` no funciona: revisa la versión de Angular CLI (`npm install -g @angular/cli@20.3.2` si hace falta).

---

## 11. Recursos

- Angular CLI: https://angular.dev/guide/cli
- DayPilot Lite: https://www.daypilot.org/
- Supabase JS: https://supabase.com/docs/reference/javascript
