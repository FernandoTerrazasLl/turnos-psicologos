import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ReservaService } from './reserva.service';
import { Reserva } from './reserva.model';
import { supabase } from '../../shared/api/supabase.client';

describe('ReservaService Unit Tests (Vitest)', () => {
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

  test('crearReserva_DatosCompletos_GuardaExitosamente', async () => {
    // HU-3 - Criterio 1: Caso válido
    // Dado que el usuario ingresa datos correctos y completos en el formulario,
    // cuando guarda el turno, entonces el sistema debe asignarle un ID único
    // y guardarlo exitosamente en el servidor de base de datos.

    const nuevaReservaInput: Omit<Reserva, 'id'> = {
      start: '2026-05-22T16:00:00.000Z',
      end: '2026-05-22T17:00:00.000Z',
      nombre: 'Carlos',
      apellido: 'Rojas',
      telefono: '77788899',
      correo: 'carlos@example.com',
      carnet: '789123',
      motivo: 'Control'
    };

    const mockResponseReserva: Reserva = {
      ...nuevaReservaInput,
      id: 'mocked-id-123'
    };

    // Chaining mock en Vitest:
    const mockSingle = vi.fn().mockResolvedValue({ data: mockResponseReserva, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await service.crearReserva(nuevaReservaInput);

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockInsert).toHaveBeenCalled();
    expect(result).toEqual(mockResponseReserva);
  });

  test('crearReserva_FaltaDatoObligatorio_ImpedirGuardar', async () => {
    // HU-3 - Criterio 2: Caso inválido
    // Dado que el usuario intenta guardar un turno incompleto (por ejemplo, sin nombre),
    // cuando hace clic en guardar, entonces el sistema debe impedir el guardado
    // y retornar un error o valor nulo del servidor de base de datos.

    const incompletaReservaInput: Omit<Reserva, 'id'> = {
      start: '2026-05-22T16:00:00.000Z',
      end: '2026-05-22T17:00:00.000Z',
      nombre: '', // Campo obligatorio vacío
      apellido: 'Rojas',
      telefono: '77788899',
      correo: 'carlos@example.com',
      carnet: '789123',
      motivo: 'Control'
    };

    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Missing required field: nombre' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await service.crearReserva(incompletaReservaInput);

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(result).toBeNull();
  });

  test('actualizarReserva_ModificaDatos_GuardaExitosamente', async () => {
    // HU-4 - Criterio 1: Caso válido
    // Dado que el usuario modifica los datos válidos de un turno preexistente,
    // cuando guarda los cambios, entonces el sistema debe actualizar el registro en la base de datos.

    const reservaModificada: Reserva = {
      id: '1',
      start: '2026-05-22T10:30:00.000Z', // Modificada la hora
      end: '2026-05-22T11:30:00.000Z',
      nombre: 'Juan Modificado',
      apellido: 'Perez',
      telefono: '12345678',
      correo: 'juan.mod@example.com',
      carnet: '123456',
      motivo: 'Consulta urgente'
    };

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    vi.spyOn(supabase, 'from').mockReturnValue({ update: mockUpdate } as any);

    await service.actualizarReserva(reservaModificada);

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockUpdate).toHaveBeenCalledWith({
      start: reservaModificada.start,
      end: reservaModificada.end,
      nombre: reservaModificada.nombre,
      apellido: reservaModificada.apellido,
      telefono: reservaModificada.telefono,
      correo: reservaModificada.correo,
      carnet: reservaModificada.carnet,
      motivo: reservaModificada.motivo
    });
    expect(mockEq).toHaveBeenCalledWith('id', reservaModificada.id);
  });

  test('verificarDisponibilidad_Solapamiento_RetornaFalso', () => {
    // HU-3 - Criterio 1: Regla de negocio de no solapamiento
    // Dado que se tiene un conjunto de turnos agendados en memoria,
    // cuando se intenta crear un nuevo turno en un horario que colisiona (solapa) con uno existente,
    // entonces verificarDisponibilidad debe retornar falso.

    // Intento de reserva que se solapa a la mitad con el mock [10:00 - 11:00]
    const startSolapado = '2026-05-22T10:30:00.000Z';
    const endSolapado = '2026-05-22T11:30:00.000Z';

    const esDisponible = service.verificarDisponibilidad(startSolapado, endSolapado, mockReservas);

    expect(esDisponible).toBe(false);
  });
});
