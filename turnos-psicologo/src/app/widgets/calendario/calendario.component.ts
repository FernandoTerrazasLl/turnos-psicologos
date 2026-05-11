import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { DayPilot, DayPilotCalendarComponent, DayPilotNavigatorComponent, DayPilotModule } from '@daypilot/daypilot-lite-angular';
import { ReservaService } from '../../entities/reserva/reserva.service';
import { DiaNoLaboralService } from '../../shared/lib/dia-no-laboral.service';
import { DisponibilidadService } from '../../shared/lib/disponibilidad.service';
import { AlertaService } from '../../shared/lib/alerta.service';
import { Reserva } from '../../entities/reserva/reserva.model';
import { obtenerConfiguracionCalendario, obtenerConfiguracionNavigator, ESTILOS_EVENTO } from '../../shared/config/daypilot.config';

/**
 * ============================================================================
 * COMPONENTE: CalendarioComponent
 * ============================================================================
 * Este es el componente principal ("Widget") que agrupa toda la funcionalidad
 * de la vista del calendario.
 * 
 * LIBRERÍA EXTERNA: DayPilot Lite for Angular
 * Aquí usamos tres cosas clave de DayPilot:
 * 1. DayPilotCalendarComponent: Es la grilla grande de la semana (donde se ven los turnos).
 * 2. DayPilotNavigatorComponent: Es el mini-calendario de la izquierda para seleccionar fechas.
 * 3. DayPilot.Modal: Son las ventanitas flotantes (popups) para mostrar formularios y alertas.
 * ============================================================================
 */
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [DayPilotModule], // Necesario para usar <daypilot-calendar> y <daypilot-navigator> en el HTML
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements AfterViewInit {

  // @ViewChild nos permite acceder a los componentes de DayPilot que están en el HTML
  @ViewChild('calendario') calendarioRef!: DayPilotCalendarComponent;
  @ViewChild('navigator') navigatorRef!: DayPilotNavigatorComponent;

  // Esta lista guarda los eventos en el formato exacto que DayPilot necesita para dibujarlos
  events: DayPilot.EventData[] = [];
  
  // Esta lista guarda las reservas en crudo para verificar rápidamente si hay cruces de horarios
  reservasCache: Reserva[] = [];

  // Configuraciones para los componentes de DayPilot
  navigatorConfig: DayPilot.NavigatorConfig;
  calendarConfig: DayPilot.CalendarConfig;

  constructor(
    private reservaService: ReservaService,
    private diaService: DiaNoLaboralService,
    private disponibilidadService: DisponibilidadService,
    private alertaService: AlertaService
  ) {
    // 1. Inicializamos el mini-calendario (Navigator)
    this.navigatorConfig = obtenerConfiguracionNavigator();
    
    // ¿Qué pasa cuando el usuario hace clic en una fecha del mini-calendario?
    this.navigatorConfig.onTimeRangeSelected = (args) => {
      // Cambiamos la fecha de inicio del calendario grande para que coincida
      this.calendarConfig.startDate = args.start;
    };

    // 2. Inicializamos el calendario grande (Calendar)
    this.calendarConfig = obtenerConfiguracionCalendario();

    // ¿Qué pasa cuando el usuario arrastra el mouse creando un rango vacío? (Para crear turno)
    this.calendarConfig.onTimeRangeSelected = async (args) => {
      await this.manejarSeleccionRango(args.start, args.end);
    };

    // ¿Qué pasa cuando el usuario hace clic sobre un turno ya existente? (Para editar)
    this.calendarConfig.onEventClick = async (args) => {
      await this.editarReserva(args.e.id() as string);
    };

    // ¿Qué pasa cuando el usuario agarra un turno y lo mueve a otro día/hora?
    this.calendarConfig.onEventMoved = (args) => {
      void this.manejarMoverEvento(args.e, args.newStart, args.newEnd);
    };

    // ¿Qué pasa cuando el usuario estira un turno por debajo o arriba? (Cambiar duración)
    this.calendarConfig.onEventResized = (args) => {
      void this.manejarRedimensionarEvento(args.e, args.newStart, args.newEnd);
    };

    // Este evento se dispara justo antes de pintar cada bloque de turno en la pantalla.
    // Lo usamos para inyectarle colores y el botoncito de "X" para borrar.
    this.calendarConfig.onBeforeEventRender = (args) => {
      this.estilizarEvento(args);
    };

    // Este evento se dispara para pintar las cabeceras de los días. 
    // Lo usamos para pintar de gris los fines de semana.
    this.calendarConfig.onBeforeHeaderRender = (args) => {
      this.estilizarColumna(args);
    };
  }

  // Se ejecuta automáticamente justo después de que el HTML se carga en pantalla
  ngAfterViewInit(): void {
    this.registrarLocaleEspanol(); // Traducir DayPilot al español
    void this.cargarEventos();     // Traer los turnos de la base de datos (Supabase)
  }


  /**
   * ============================================================================
   * MÉTODOS DE INTERACCIÓN PRINCIPALES
   * ============================================================================
   */

  private async manejarSeleccionRango(start: DayPilot.Date, end: DayPilot.Date): Promise<void> {
    // Si seleccionó un sábado o domingo, bloqueamos
    if (this.diaService.esFinDeSemana(start)) {
      this.calendarioRef.control.clearSelection(); // Borramos el área sombreada amarilla
      await this.alertaService.error('No se pueden agendar turnos los sábados ni domingos.');
      return;
    }
    
    // Abrimos el popup para crear la reserva
    await this.crearReserva(start, end);
    this.calendarioRef.control.clearSelection();
  }

  private async manejarMoverEvento(event: DayPilot.Event, newStart: DayPilot.Date, newEnd: DayPilot.Date): Promise<void> {
    // Verificamos que no mueva el turno a un fin de semana
    if (this.diaService.esFinDeSemana(newStart)) {
      await this.cargarEventos(); // Refrescar para devolver el turno a donde estaba
      await this.alertaService.error('No se pueden agendar turnos los sábados ni domingos.');
      return;
    }

    const reserva = await this.reservaService.obtenerReservaPorId(event.id() as string);
    if (!reserva) return;

    // Verificamos que no haya otro turno en ese horario
    if (!this.disponibilidadService.verificar(newStart.toString(), newEnd.toString(), this.reservasCache, reserva.id)) {
      await this.cargarEventos();
      await this.alertaService.error('Este horario ya está ocupado.');
      return;
    }

    // Guardamos en Supabase
    await this.reservaService.actualizarReserva({ ...reserva, start: newStart.toString(), end: newEnd.toString() });
    await this.cargarEventos();
    await this.alertaService.info(`📅 Turno reprogramado.\n\n📞 Comuníquese con el paciente para informar del cambio.`);
  }

  private async manejarRedimensionarEvento(event: DayPilot.Event, newStart: DayPilot.Date, newEnd: DayPilot.Date): Promise<void> {
    if (this.diaService.esFinDeSemana(newStart)) {
      await this.cargarEventos();
      await this.alertaService.error('No se pueden agendar turnos los sábados ni domingos.');
      return;
    }

    const reserva = await this.reservaService.obtenerReservaPorId(event.id() as string);
    if (!reserva) return;

    if (!this.disponibilidadService.verificar(newStart.toString(), newEnd.toString(), this.reservasCache, reserva.id)) {
      await this.cargarEventos();
      await this.alertaService.error('El horario se solapa con otro turno.');
      return;
    }

    await this.reservaService.actualizarReserva({ ...reserva, start: newStart.toString(), end: newEnd.toString() });
    await this.cargarEventos();
  }


  /**
   * ============================================================================
   * OPERACIONES CRUD (Crear, Editar, Listar)
   * ============================================================================
   */

  async crearReserva(start: DayPilot.Date, end: DayPilot.Date): Promise<void> {
    const form = this.construirFormularioCrear();
    
    // Pre-llenamos el formulario con las fechas que arrastró en el calendario
    const data = {
      fecha: start.toString('yyyy-MM-dd'),
      horaInicio: start.toString('HH:mm'),
      horaFin: end.toString('HH:mm'),
      nombre: '', apellido: '', telefono: '', correo: '', carnet: '', motivo: ''
    };

    // Usamos DayPilot.Modal para abrir un popup emergente nativo de la librería
    const modal = await DayPilot.Modal.form(form, data, { theme: 'modal_default', okText: 'Guardar', cancelText: 'Cancelar', width: 450 });

    if (modal.canceled) return; // Si apretó cancelar, salimos

    const datosValidados = this.validarFormularioReserva(modal.result);
    if (!datosValidados) return;

    if (!this.disponibilidadService.verificar(datosValidados.start, datosValidados.end, this.reservasCache)) {
      await this.alertaService.error('Este horario ya está ocupado. Por favor seleccione otro.');
      return;
    }

    // Guardar en la base de datos a través de nuestro servicio
    await this.reservaService.crearReserva(datosValidados);
    
    // Refrescamos la pantalla para ver el nuevo turno
    await this.cargarEventos();
    await this.alertaService.exito('Reserva creada exitosamente.');
  }

  async editarReserva(idReserva: string): Promise<void> {
    const reserva = await this.reservaService.obtenerReservaPorId(idReserva);
    if (!reserva) return;

    const form = this.construirFormularioEditar(reserva);
    const startDate = new DayPilot.Date(reserva.start);
    const endDate = new DayPilot.Date(reserva.end);

    const data = {
      fecha: startDate.toString('yyyy-MM-dd'),
      horaInicio: startDate.toString('HH:mm'),
      horaFin: endDate.toString('HH:mm'),
      ...reserva // Copiamos nombre, apellido, telefono, etc.
    };

    const modal = await DayPilot.Modal.form(form, data, { theme: 'modal_default', okText: 'Guardar Cambios', cancelText: 'Cerrar', width: 450 });

    if (modal.canceled) return;

    const datosValidados = this.validarFormularioReserva(modal.result);
    if (!datosValidados) return;

    if (!this.disponibilidadService.verificar(datosValidados.start, datosValidados.end, this.reservasCache, reserva.id)) {
      await this.alertaService.error('Este horario ya está ocupado. Por favor seleccione otro.');
      return;
    }

    await this.reservaService.actualizarReserva({ ...reserva, ...datosValidados });
    await this.cargarEventos();
    await this.alertaService.exito('Turno actualizado.');
  }

  async cargarEventos(): Promise<void> {
    // 1. Obtenemos las reservas reales de Supabase
    const reservas = await this.reservaService.obtenerReservas();
    this.reservasCache = reservas;
    
    // 2. Las mapeamos al formato que DayPilot entiende (DayPilot.EventData)
    this.events = reservas.map(r => ({
      id: r.id,
      start: r.start,
      end: r.end,
      text: `${r.nombre} ${r.apellido}`, // Lo que se imprime en la cajita
      tags: { // Datos extras guardados en el evento
        nombre: r.nombre,
        apellido: r.apellido,
        telefono: r.telefono,
      }
    }));
  }

  /**
   * ============================================================================
   * CONSTRUCCIÓN DE FORMULARIOS DE DAYPILOT
   * ============================================================================
   */
  private construirFormularioCrear(): DayPilot.ModalFormItem[] {
    return [
      { name: 'Fecha y Hora de la Cita', type: 'title' },
      { name: 'Fecha', id: 'fecha', type: 'date', dateFormat: 'dd/MM/yyyy' },
      { name: 'Hora inicio (ej: 09:00)', id: 'horaInicio', type: 'text' },
      { name: 'Hora fin (ej: 10:00)', id: 'horaFin', type: 'text' },
      { name: 'Datos del Paciente', type: 'title' },
      { name: 'Nombre *', id: 'nombre', type: 'text' },
      { name: 'Apellido *', id: 'apellido', type: 'text' },
      { name: 'Teléfono *', id: 'telefono', type: 'text' },
      { name: 'Correo *', id: 'correo', type: 'text' },
      { name: 'Carnet *', id: 'carnet', type: 'text' },
      { name: 'Detalles de la Consulta', type: 'title' },
      { name: 'Motivo de consulta *', id: 'motivo', type: 'textarea', height: 60 }
    ];
  }

  private construirFormularioEditar(reserva: Reserva): DayPilot.ModalFormItem[] {
    // Es idéntico al de crear, pero DayPilot detecta los valores y los rellena
    return this.construirFormularioCrear();
  }

  /**
   * ============================================================================
   * VALIDACIONES
   * ============================================================================
   */
  private validarFormularioReserva(result: any): Omit<Reserva, 'id'> | null {
    if (!result.nombre?.trim() || !result.apellido?.trim() || !result.telefono?.trim() || !result.fecha || !result.horaInicio || !result.horaFin) {
      void this.alertaService.error('Faltan datos obligatorios.');
      return null;
    }

    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(result.horaInicio) || !horaRegex.test(result.horaFin)) {
      void this.alertaService.error('Formato de hora inválido. Use HH:MM.');
      return null;
    }

    const soloFecha = new DayPilot.Date(result.fecha).toString('yyyy-MM-dd');
    if (this.diaService.esFinDeSemana(soloFecha)) {
      void this.alertaService.error('No se pueden agendar turnos en fin de semana.');
      return null;
    }

    return {
      start: `${soloFecha}T${result.horaInicio}:00`,
      end: `${soloFecha}T${result.horaFin}:00`,
      nombre: result.nombre.trim(),
      apellido: result.apellido.trim(),
      telefono: result.telefono.trim(),
      correo: result.correo.trim(),
      carnet: result.carnet.trim(),
      motivo: result.motivo.trim()
    };
  }

  /**
   * ============================================================================
   * ESTILIZACIÓN Y UTILIDADES
   * ============================================================================
   */
  private estilizarEvento(args: any): void {
    // Colores del bloque de turno (configurados en daypilot.config.ts)
    args.data.backColor = ESTILOS_EVENTO.FONDO;
    args.data.fontColor = ESTILOS_EVENTO.TEXTO;
    args.data.borderColor = ESTILOS_EVENTO.BORDE;
    args.data.barHidden = true;
    
    // Inyectamos un pequeño botón "X" en la esquina superior derecha
    args.data.areas = [
      {
        top: 4, right: 4, width: 20, height: 20, text: '✕',
        fontColor: ESTILOS_EVENTO.TEXTO, style: ESTILOS_EVENTO.BOTON_HOVER,
        visibility: 'Hover', // Solo aparece cuando paso el mouse
        onClick: async (areaArgs: any) => {
          const reserva = await this.reservaService.obtenerReservaPorId(areaArgs.source.id() as string);
          if (reserva && await this.alertaService.confirmar(`¿Cancelar turno de ${reserva.nombre}?`, 'Sí', 'No')) {
            await this.reservaService.eliminarReserva(reserva.id);
            await this.cargarEventos();
          }
        }
      }
    ];
  }

  private estilizarColumna(args: any): void {
    // Pintamos las columnas de fin de semana en color gris
    if (this.diaService.esFinDeSemana(new DayPilot.Date(args.column.start))) {
      args.header.backColor = '#f0f0f0';
    }
  }

  private registrarLocaleEspanol(): void {
    // Le enseñamos a DayPilot a hablar español
    DayPilot.Locale.register(
      new DayPilot.Locale('es-es', {
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        timePattern: 'HH:mm', datePattern: 'dd/MM/yyyy', dateTimePattern: 'dd/MM/yyyy HH:mm',
        timeFormat: 'Clock24Hours', weekStarts: 1 // La semana empieza el lunes (1)
      })
    );
  }

  irAHoy(): void {
    this.calendarConfig.startDate = DayPilot.Date.today();
    this.navigatorRef.control.select(DayPilot.Date.today());
    void this.cargarEventos();
  }

  async crearReservaManual(): Promise<void> {
    const start = DayPilot.Date.today().addHours(9); // Default 09:00 AM
    const end = start.addHours(1); // Default 1 hora de duración
    await this.crearReserva(start, end);
  }
}

