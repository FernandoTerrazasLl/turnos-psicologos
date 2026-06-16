import '@angular/compiler';
import { describe, test, expect, beforeEach } from 'vitest';
import { DiaNoLaboralService } from '../shared/lib/dia-no-laboral.service';
import { DayPilot } from '@daypilot/daypilot-lite-angular';

describe('DiaNoLaboralService Unit Tests', () => {
  let service: DiaNoLaboralService;

  beforeEach(() => {
    service = new DiaNoLaboralService();
  });

  test('esFinDeSemana_DiaSabadoODomingo_RetornaTrue', () => {
    // [HU-01-2] Visualización de la Agenda
    // CA: (LÍMITE) Dado que estoy visualizando mi agenda, cuando el calendario renderiza los días de la semana, 
    // entonces el sistema identifica los días no laborales (sábado y domingo)...
    
    // 2026-05-23 es Sábado, 2026-05-24 es Domingo, 2026-05-25 es Lunes
    const fechaSabado = new DayPilot.Date('2026-05-23T00:00:00');
    const fechaDomingo = new DayPilot.Date('2026-05-24T00:00:00');
    const fechaLunes = new DayPilot.Date('2026-05-25T00:00:00');

    expect(service.esFinDeSemana(fechaSabado)).toBe(true);
    expect(service.esFinDeSemana(fechaDomingo)).toBe(true);
    expect(service.esFinDeSemana(fechaLunes)).toBe(false);
  });

  test('esValida_DiaLaboralYNoLaboral_RetornaValidezCorrecta', () => {
    // 2026-05-23 es Sábado (No laboral -> Inválido)
    // 2026-05-25 es Lunes (Laboral -> Válido)
    const fechaSabado = '2026-05-23T00:00:00';
    const fechaLunes = '2026-05-25T00:00:00';

    expect(service.esValida(fechaSabado)).toBe(false);
    
    expect(service.esValida(fechaLunes)).toBe(true);
  });

  test('esDiaLaboral_DiaLaboralYNoLaboral_RetornaValidezCorrecta', () => {
    // 2026-05-23 es Sábado (No laboral)
    // 2026-05-25 es Lunes (Laboral)
    const fechaSabado = '2026-05-23T00:00:00';
    const fechaLunes = '2026-05-25T00:00:00';

    expect(service.esDiaLaboral(fechaSabado)).toBe(false);
    expect(service.esDiaLaboral(fechaLunes)).toBe(true);
  });

  test('obtenerNombreDia_VariasFechas_RetornaElNombreCorrecto', () => {
    const fechaDomingo = '2026-05-24T00:00:00';
    const fechaLunes = '2026-05-25T00:00:00';
    const fechaMiercoles = '2026-05-27T00:00:00';
    const fechaSabado = '2026-05-30T00:00:00';

    expect(service.obtenerNombreDia(fechaDomingo)).toBe('Domingo');
    expect(service.obtenerNombreDia(fechaLunes)).toBe('Lunes');
    expect(service.obtenerNombreDia(fechaMiercoles)).toBe('Miércoles');
    expect(service.obtenerNombreDia(fechaSabado)).toBe('Sábado');
  });
});