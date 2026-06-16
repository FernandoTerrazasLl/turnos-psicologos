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
    // [HU-01-1] Visualización de la Agenda
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
    // [HU-02-1] Consulta de Datos del Paciente
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

  test('obtenerReservaPorId_IdInvalido_RetornaUndefined', async () => {
    // [HU-02-2] Consulta de Datos del Paciente
    // CA: (INVÁLIDO) Dado que intento consultar un turno que fue eliminado,
    // cuando el sistema busca su ID, entonces la búsqueda falla y retorna nulo/undefined.
    
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.spyOn(supabase, 'from').mockReturnValue({ select: mockSelect } as any);

    const result = await service.obtenerReservaPorId('ID_INEXISTENTE');

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('id', 'ID_INEXISTENTE');
    expect(result).toBeUndefined();
  });

  test('crearReserva_DatosCompletos_GuardaExitosamente', async () => {
    // [HU3-1] Creación Manual de Reservas
    // CA: (VÁLIDO) Dado que selecciono un horario libre de lunes a viernes, cuando ingreso todos los datos obligatorios 
    // del paciente y guardo, entonces el sistema genera un ID único, guarda la reserva en la base de datos y el bloque de tiempo pasa a estado ocupado.
    
    const nuevaReservaSinId = {
      start: '2026-05-25T10:00:00.000Z',
      end: '2026-05-25T11:00:00.000Z',
      nombre: 'Pedro',
      apellido: 'Sanchez',
      telefono: '11223344',
      correo: 'pedro@example.com',
      carnet: '987654',
      motivo: 'Primera sesion'
    };
    
    const reservaGenerada = { ...nuevaReservaSinId, id: 'id_generado_123' };
    
    const mockSingle = vi.fn().mockResolvedValue({ data: reservaGenerada, error: null });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const result = await service.crearReserva(nuevaReservaSinId);

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockInsert).toHaveBeenCalled();
    const objetoInsertado = mockInsert.mock.calls[0][0][0];
    expect(objetoInsertado.nombre).toBe(nuevaReservaSinId.nombre);
    expect(objetoInsertado.id).toBeDefined();
    expect(result).toEqual(reservaGenerada);
  });

  test('crearReserva_DatosInvalidosUOmisos_RetornaNull', async () => {
    // [HU3-2] Creación Manual de Reservas
    // CA: (INVÁLIDO) Dado que estoy creando una reserva manual, cuando omito algún dato obligatorio del paciente 
    // (ej. nombre o teléfono) o introduzco un formato de hora inválido, entonces el validador del sistema 
    // me impide guardar y retorna un error solicitando corregir la información.
    
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Faltan datos obligatorios' } });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    vi.spyOn(supabase, 'from').mockReturnValue({ insert: mockInsert } as any);

    const reservaInvalida = {
      start: '2026-05-25T10:00:00.000Z',
      end: '2026-05-25T11:00:00.000Z',
      nombre: '',
      apellido: 'Sanchez',
      telefono: '', 
      correo: 'pedro@example.com',
      carnet: '987654',
      motivo: 'Primera sesion'
    };

    const result = await service.crearReserva(reservaInvalida);

    expect(supabase.from).toHaveBeenCalledWith('turnos');
    expect(mockInsert).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
