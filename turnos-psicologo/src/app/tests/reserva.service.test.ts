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

  test('obtenerReservas_ConexionExitosa_RetornaListaDeTurnos', async () => {
    // [HU-01] Visualización de la Agenda
    // CA: Dado que he ingresado al sistema, cuando accedo a la sección principal, 
    // entonces el sistema se conecta a la base de datos, obtiene la lista de turnos...
    
    const mockOrder = vi.fn().mockResolvedValue({ data: mockReservas, error: null });
    const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });
    vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await service.obtenerReservas();

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('start', { ascending: true });
    expect(result).toEqual(mockReservas);
  });

  test('obtenerReservaPorId_IdValido_RetornaDatosCompletos', async () => {
    // [HU-02] Consulta de Datos del Paciente
    // CA: (VÁLIDO) Dado que visualizo mi calendario, cuando selecciono un horario específico ya reservado, 
    // entonces el sistema busca la reserva por su ID y despliega una vista modal con el nombre...
    
    const mockSingle = vi.fn().mockResolvedValue({ data: mockReservas[0], error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await service.obtenerReservaPorId('1');

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', '1');
    expect(result).toEqual(mockReservas[0]);
  });
});
