import { describe, test, expect, vi } from 'vitest';
import { AlertaService } from './alerta.service';
import { DayPilot } from '@daypilot/daypilot-lite-angular';

// Mockear DayPilot Modal
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

describe('AlertaService (Vitest)', () => {
  test('debe llamar a DayPilot.Modal.alert con el mensaje correcto en info()', async () => {
    const service = new AlertaService();
    const mensaje = 'Mensaje de prueba';
    
    await service.info(mensaje);
    
    expect(DayPilot.Modal.alert).toHaveBeenCalledWith(mensaje, {
      theme: 'modal_default',
      okText: 'Entendido'
    });
  });

  test('debe retornar true si el usuario confirma en confirmar()', async () => {
    const service = new AlertaService();
    const pregunta = '¿Aceptar?';
    
    // Mockear confirm para retornar canceled: false
    vi.mocked(DayPilot.Modal.confirm).mockResolvedValue({ canceled: false } as any);
    
    const resultado = await service.confirmar(pregunta);
    
    expect(resultado).toBe(true);
    expect(DayPilot.Modal.confirm).toHaveBeenCalledWith(pregunta, {
      theme: 'modal_default',
      okText: 'Sí',
      cancelText: 'No'
    });
  });

  test('debe retornar false si el usuario cancela en confirmar()', async () => {
    const service = new AlertaService();
    const pregunta = '¿Aceptar?';
    
    // Mockear confirm para retornar canceled: true
    vi.mocked(DayPilot.Modal.confirm).mockResolvedValue({ canceled: true } as any);
    
    const resultado = await service.confirmar(pregunta);
    
    expect(resultado).toBe(false);
  });
});
