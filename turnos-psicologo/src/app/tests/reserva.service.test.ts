import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ReservaService } from '../entities/reserva/reserva.service';
import { Reserva } from '../entities/reserva/reserva.model';
import { supabase } from '../shared/api/supabase.client';

describe('ReservaService Unit Tests', () => {
  let service: ReservaService;

  const mockReservas: Reserva[] = [
    {
      id: '1',
      start: '2026-05-22T10:00:00.000Z',
      end: '2026-05-22T11:00:00.000Z',
      nombre: 'Juan',
      apellido: 'Perez',
      telefono: '12345678',
      correo: 'juan@example.com',
      carnet: '123456',
      motivo: 'Consulta general'
    },
    {
      id: '2',
      start: '2026-05-22T14:00:00.000Z',
      end: '2026-05-22T15:00:00.000Z',
      nombre: 'Maria',
      apellido: 'Gomez',
      telefono: '87654321',
      correo: 'maria@example.com',
      carnet: '654321',
      motivo: 'Terapia'
    }
  ];

  beforeEach(() => {
    service = new ReservaService();
  });
  
});
