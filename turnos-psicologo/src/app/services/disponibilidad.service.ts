import { Injectable } from '@angular/core';
import { Reserva } from '../models/reserva.model';
import { ValidadorDisponibilidad } from '../core/contratos';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService implements ValidadorDisponibilidad {
  verificar(
    start: string,
    end: string,
    reservas: Reserva[],
    excludeId?: string
  ): boolean {
    const candidatos = reservas.filter(r => r.id !== excludeId);
    const newStart = new Date(start).getTime();
    const newEnd = new Date(end).getTime();

    return !candidatos.some(r => {
      const rStart = new Date(r.start).getTime();
      const rEnd = new Date(r.end).getTime();
      return newStart < rEnd && newEnd > rStart;
    });
  }
}
