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
    // [HU-01] Visualización de la Agenda
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
});