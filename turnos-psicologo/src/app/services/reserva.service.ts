import { Injectable } from '@angular/core';
import { Reserva } from '../models/reserva.model';
import { supabase } from '../supabase.client';

@Injectable({ providedIn: 'root' })
export class ReservaService {
  async obtenerReservas(): Promise<Reserva[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .order('start', { ascending: true });

    if (error) {
      console.error('Error al obtener reservas:', error.message);
      return [];
    }
    return (data as Reserva[]) ?? [];
  }

  async obtenerReservaPorId(id: string): Promise<Reserva | undefined> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error al obtener reserva:', error.message);
      return undefined;
    }
    return data as Reserva;
  }

  async crearReserva(reserva: Omit<Reserva, 'id'>): Promise<Reserva | null> {
    const nueva: Reserva = {
      ...reserva,
      id: this.generarId()
    };

    const { data, error } = await supabase
      .from('turnos')
      .insert([nueva])
      .select()
      .single();

    if (error) {
      console.error('Error al crear reserva:', error.message);
      return null;
    }
    return data as Reserva;
  }

  async actualizarReserva(reserva: Reserva): Promise<void> {
    const { error } = await supabase
      .from('turnos')
      .update({
        start: reserva.start,
        end: reserva.end,
        nombre: reserva.nombre,
        apellido: reserva.apellido,
        telefono: reserva.telefono,
        correo: reserva.correo,
        carnet: reserva.carnet,
        motivo: reserva.motivo
      })
      .eq('id', reserva.id);

    if (error) {
      console.error('Error al actualizar reserva:', error.message);
    }
  }

  async eliminarReserva(id: string): Promise<void> {
    const { error } = await supabase
      .from('turnos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar reserva:', error.message);
    }
  }

  verificarDisponibilidad(start: string, end: string, reservasEnMemoria: Reserva[], excludeId?: string): boolean {
    const candidatos = reservasEnMemoria.filter(r => r.id !== excludeId);
    const newStart = new Date(start).getTime();
    const newEnd = new Date(end).getTime();

    return !candidatos.some(r => {
      const rStart = new Date(r.start).getTime();
      const rEnd = new Date(r.end).getTime();
      return newStart < rEnd && newEnd > rStart;
    });
  }

  private generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }
}
