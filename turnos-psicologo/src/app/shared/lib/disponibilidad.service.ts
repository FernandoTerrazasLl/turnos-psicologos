import { Injectable } from '@angular/core';
import { Reserva } from '../../entities/reserva/reserva.model';
import { ValidadorDisponibilidad } from './contratos';
import { ReservaService } from '../../entities/reserva/reserva.service';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService implements ValidadorDisponibilidad {
  constructor(private reservaService: ReservaService) {}

  verificar(start: string, end: string, reservas: Reserva[], excludeId?: string): boolean {
    return this.reservaService.verificarDisponibilidad(start, end, reservas, excludeId);
  }
}
