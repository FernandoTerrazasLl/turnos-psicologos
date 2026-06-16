import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DisponibilidadService } from '../shared/lib/disponibilidad.service';
import { ReservaService } from '../entities/reserva/reserva.service';

describe('DisponibilidadService Unit Tests', () => {
  let disponibilidadService: DisponibilidadService;
  let reservaServiceMock: any;

  beforeEach(() => {
    reservaServiceMock = {
      verificarDisponibilidad: vi.fn()
    };
    disponibilidadService = new DisponibilidadService(reservaServiceMock as unknown as ReservaService);
  });

  test('verificar_DelegaLaValidacionAReservaService_RetornaElMismoResultado', () => {
    const start = '2026-05-25T10:00:00.000Z';
    const end = '2026-05-25T11:00:00.000Z';
    const reservasMock: any[] = [{ id: '1' }];
    const excludeId = '2';
    reservaServiceMock.verificarDisponibilidad.mockReturnValue(true);

    const resultado = disponibilidadService.verificar(start, end, reservasMock, excludeId);

    expect(reservaServiceMock.verificarDisponibilidad).toHaveBeenCalledWith(start, end, reservasMock, excludeId);
    expect(resultado).toBe(true);
  });
});