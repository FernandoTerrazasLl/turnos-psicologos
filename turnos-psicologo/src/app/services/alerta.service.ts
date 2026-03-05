import { Injectable } from '@angular/core';
import { DayPilot } from '@daypilot/daypilot-lite-angular';
import { ServicioAlerta } from '../core/contratos';

@Injectable({ providedIn: 'root' })
export class AlertaService implements ServicioAlerta {
  private readonly TEMA = 'modal_default';

  async info(mensaje: string): Promise<void> {
    await DayPilot.Modal.alert(mensaje, {
      theme: this.TEMA,
      okText: 'Entendido'
    });
  }

  async error(mensaje: string): Promise<void> {
    const mensajeConEmoji = `❌ ${mensaje}`;
    await this.info(mensajeConEmoji);
  }

  async exito(mensaje: string): Promise<void> {
    const mensajeConEmoji = `✅ ${mensaje}`;
    await this.info(mensajeConEmoji);
  }

  async confirmar(pregunta: string, textoSi: string = 'Sí', textoNo: string = 'No'): Promise<boolean> {
    const resultado = await DayPilot.Modal.confirm(pregunta, {
      theme: this.TEMA,
      okText: textoSi,
      cancelText: textoNo
    });
    return !resultado.canceled;
  }
}
