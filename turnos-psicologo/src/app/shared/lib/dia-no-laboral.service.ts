import { Injectable } from '@angular/core';
import { DayPilot } from '@daypilot/daypilot-lite-angular';
import { ValidadorFecha } from './contratos';

@Injectable({ providedIn: 'root' })
export class DiaNoLaboralService implements ValidadorFecha {
  private readonly DIAS_NO_LABORALES = [0, 6]; // 0=Domingo, 6=Sábado

  esValida(fecha: string | Date): boolean {
    return !this.esFinDeSemana(fecha as string);
  }

  esFinDeSemana(fecha: DayPilot.Date | string): boolean {
    // TODO: Implementar lógica para detectar fines de semana
    return false;
  }

  esDiaLaboral(fecha: DayPilot.Date | string): boolean {
    return !this.esFinDeSemana(fecha);
  }

  obtenerNombreDia(fecha: DayPilot.Date | string): string {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dia = new DayPilot.Date(fecha).getDayOfWeek();
    return dias[dia];
  }
}
