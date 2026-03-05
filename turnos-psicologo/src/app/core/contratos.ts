export interface ValidadorFecha {
  esValida(fecha: string | Date): boolean;
}

export interface ValidadorDisponibilidad {
  verificar(start: string, end: string, reservasEnMemoria: any[], excludeId?: string): boolean;
}

export interface ServicioAlerta {
  info(mensaje: string): Promise<void>;
  error(mensaje: string): Promise<void>;
  exito(mensaje: string): Promise<void>;
  confirmar(pregunta: string, textoSi?: string, textoNo?: string): Promise<boolean>;
}
