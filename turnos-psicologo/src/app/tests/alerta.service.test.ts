import { describe, test, expect, vi } from 'vitest';
import { AlertaService } from '../shared/lib/alerta.service';
import { DayPilot } from '@daypilot/daypilot-lite-angular';

vi.mock('@daypilot/daypilot-lite-angular', () => {
  return {
    DayPilot: {
      Modal: {
        alert: vi.fn(),
        confirm: vi.fn()
      }
    }
  };
});

describe('AlertaService', () => {
  test('info_introduceMessageString_reeturnCorrectMessage', async () => {
    const service = new AlertaService();
    const mensaje = 'Mensaje de prueba';
    
    await service.info(mensaje);
    
    expect(DayPilot.Modal.alert).toHaveBeenCalledWith(mensaje, {
      theme: 'modal_default',
      okText: 'Entendido'
    });
  });

  test('confirmar_introduceQuestionString_returnsTrueWhenUserConfirms', async () => {
    const service = new AlertaService();
    const pregunta = '¿Aceptar?';
    
    vi.mocked(DayPilot.Modal.confirm).mockResolvedValue({ canceled: false } as any);
    
    const resultado = await service.confirmar(pregunta);
    
    expect(resultado).toBe(true);
    expect(DayPilot.Modal.confirm).toHaveBeenCalledWith(pregunta, {
      theme: 'modal_default',
      okText: 'Sí',
      cancelText: 'No'
    });
  });

  test('confirmar_introduceQuestionString_returnsFalseWhenUserCancels', async () => {
    const service = new AlertaService();
    const pregunta = '¿Aceptar?';
    
    vi.mocked(DayPilot.Modal.confirm).mockResolvedValue({ canceled: true } as any);
    
    const resultado = await service.confirmar(pregunta);
    
    expect(resultado).toBe(false);
  });

  test('confirmar_RechazoDeAlerta_AbortaBorrado_RetornaFalse', async () => {
    // [HU5-2] Cancelación de Reservas
    // CA: (INVÁLIDO) Dado que elijo una cita y presiono eliminar, cuando el sistema me pide confirmación 
    // ("¿Cancelar turno?") y selecciono la opción de cancelar/rechazar la alerta, entonces el sistema aborta 
    // el borrado y la reserva se mantiene intacta en la base de datos.
    
    const service = new AlertaService();
    const pregunta = '¿Cancelar turno?';
    
    vi.mocked(DayPilot.Modal.confirm).mockResolvedValue({ canceled: true } as any);
    
    const resultado = await service.confirmar(pregunta);
    
    expect(resultado).toBe(false);
    expect(DayPilot.Modal.confirm).toHaveBeenCalledWith(pregunta, expect.any(Object));
  });
});
