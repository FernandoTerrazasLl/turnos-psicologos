import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { DayPilot, DayPilotCalendarComponent, DayPilotNavigatorComponent, DayPilotModule } from '@daypilot/daypilot-lite-angular';
import { ReservaService } from '../../services/reserva.service';
import { DiaNoLaboralService } from '../../services/dia-no-laboral.service';
import { DisponibilidadService } from '../../services/disponibilidad.service';
import { AlertaService } from '../../services/alerta.service';
import { Reserva } from '../../models/reserva.model';
import { obtenerConfiguracionCalendario, obtenerConfiguracionNavigator, ESTILOS_EVENTO } from '../../config/daypilot.config';

/**
 * Componente principal: Calendario de reservas.
 * Responsabilidad: Orquestar la interacción entre servicios y UI.
 * SOLID: Delegación a servicios especializados.
 */
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [DayPilotModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements AfterViewInit {

  @ViewChild('calendario') calendarioRef!: DayPilotCalendarComponent;
  @ViewChild('navigator') navigatorRef!: DayPilotNavigatorComponent;

  events: DayPilot.EventData[] = [];
  reservasCache: Reserva[] = [];

  navigatorConfig: DayPilot.NavigatorConfig;
  calendarConfig: DayPilot.CalendarConfig;

  constructor(
    private reservaService: ReservaService,
    private diaService: DiaNoLaboralService,
    private disponibilidadService: DisponibilidadService,
    private alertaService: AlertaService
  ) {
    this.navigatorConfig = obtenerConfiguracionNavigator();
    this.navigatorConfig.onTimeRangeSelected = (args) => {
      this.calendarConfig.startDate = args.start;
    };

    this.calendarConfig = obtenerConfiguracionCalendario();
    this.calendarConfig.onTimeRangeSelected = async (args) => {
      await this.manejarSeleccionRango(args.start, args.end);
    };
    this.calendarConfig.onEventClick = async (args) => {
      await this.manejarClickEvento(args.e);
    };
    this.calendarConfig.onEventMoved = (args) => {
      void this.manejarMoverEvento(args.e, args.newStart, args.newEnd);
    };
    this.calendarConfig.onEventResized = (args) => {
      void this.manejarRedimensionarEvento(args.e, args.newStart, args.newEnd);
    };
    this.calendarConfig.onBeforeEventRender = (args) => {
      this.estilizarEvento(args);
    };
    this.calendarConfig.onBeforeHeaderRender = (args) => {
      this.estilizarColumna(args);
    };
  }

  ngAfterViewInit(): void {
    this.registrarLocaleEspanol();
    void this.cargarEventos();
  }

  // =====================
  // MANEJADORES DE EVENTOS
  // =====================

  private async manejarSeleccionRango(start: DayPilot.Date, end: DayPilot.Date): Promise<void> {
    if (this.diaService.esFinDeSemana(start)) {
      this.calendarioRef.control.clearSelection();
      await this.alertaService.error('No se pueden agendar turnos los sábados ni domingos.');
      return;
    }
    await this.crearReserva(start, end);
    this.calendarioRef.control.clearSelection();
  }

  private async manejarClickEvento(event: DayPilot.Event): Promise<void> {
    await this.editarReserva(event.id() as string);
  }

  private async manejarMoverEvento(
    event: DayPilot.Event,
    newStart: DayPilot.Date,
    newEnd: DayPilot.Date
  ): Promise<void> {
    if (this.diaService.esFinDeSemana(newStart)) {
      await this.cargarEventos();
      await this.alertaService.error('No se pueden agendar turnos los sábados ni domingos.');
      return;
    }

    const reserva = await this.reservaService.obtenerReservaPorId(event.id() as string);
    if (!reserva) return;

    if (!this.disponibilidadService.verificar(newStart.toString(), newEnd.toString(), this.reservasCache, reserva.id)) {
      await this.cargarEventos();
      await this.alertaService.error('Este horario ya está ocupado.');
      return;
    }

    await this.reservaService.actualizarReserva({
      ...reserva,
      start: newStart.toString(),
      end: newEnd.toString()
    });

    await this.cargarEventos();
    await this.alertaService.info(`📅 Turno reprogramado.\n\n📞 Comuníquese con ${reserva.nombre} ${reserva.apellido} para informar del cambio.\nTeléfono: ${reserva.telefono}`);
  }

  private async manejarRedimensionarEvento(
    event: DayPilot.Event,
    newStart: DayPilot.Date,
    newEnd: DayPilot.Date
  ): Promise<void> {
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

    await this.reservaService.actualizarReserva({
      ...reserva,
      start: newStart.toString(),
      end: newEnd.toString()
    });

    await this.cargarEventos();
  }

  // =====================
  // OPERACIONES CRUD
  // =====================

  async crearReserva(start: DayPilot.Date, end: DayPilot.Date): Promise<void> {
    const form = this.construirFormularioCrear();
    const data = {
      fecha: start.toString('yyyy-MM-dd'),
      horaInicio: start.toString('HH:mm'),
      horaFin: end.toString('HH:mm'),
      nombre: '',
      apellido: '',
      telefono: '',
      correo: '',
      carnet: '',
      motivo: ''
    };

    const modal = await DayPilot.Modal.form(form, data, {
      theme: 'modal_default',
      okText: 'Guardar Reserva',
      cancelText: 'Cancelar',
      width: 450
    });

    if (modal.canceled) return;

    const datosValidados = this.validarFormularioReserva(modal.result);
    if (!datosValidados) return;

    if (!this.disponibilidadService.verificar(datosValidados.start, datosValidados.end, this.reservasCache)) {
      await this.alertaService.error('Este horario ya está ocupado. Por favor seleccione otro.');
      return;
    }

    await this.reservaService.crearReserva({
      start: datosValidados.start,
      end: datosValidados.end,
      nombre: datosValidados.nombre,
      apellido: datosValidados.apellido,
      telefono: datosValidados.telefono,
      correo: datosValidados.correo,
      carnet: datosValidados.carnet,
      motivo: datosValidados.motivo
    });

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
      nombre: reserva.nombre,
      apellido: reserva.apellido,
      telefono: reserva.telefono,
      correo: reserva.correo,
      carnet: reserva.carnet,
      motivo: reserva.motivo
    };

    const modal = await DayPilot.Modal.form(form, data, {
      theme: 'modal_default',
      okText: 'Guardar Cambios',
      cancelText: 'Cerrar',
      width: 450
    });

    if (modal.canceled) return;

    const datosValidados = this.validarFormularioReserva(modal.result);
    if (!datosValidados) return;

    if (!this.disponibilidadService.verificar(datosValidados.start, datosValidados.end, this.reservasCache, reserva.id)) {
      await this.alertaService.error('Este horario ya está ocupado. Por favor seleccione otro.');
      return;
    }

    await this.reservaService.actualizarReserva({
      ...reserva,
      start: datosValidados.start,
      end: datosValidados.end,
      nombre: datosValidados.nombre,
      apellido: datosValidados.apellido,
      telefono: datosValidados.telefono,
      correo: datosValidados.correo,
      carnet: datosValidados.carnet,
      motivo: datosValidados.motivo
    });

    await this.cargarEventos();
    await this.alertaService.exito(`Turno actualizado.\n\nComuníquese con ${datosValidados.nombre} ${datosValidados.apellido} para informar del cambio.\nTeléfono: ${datosValidados.telefono}`);
  }

  async cancelarReserva(): Promise<void> {
    // Este método se llamaría desde el botón ✕ del evento (se implementaría en onBeforeEventRender)
    // Por ahora está aquí como estructura
  }

  // =====================
  // CARGA DE DATOS
  // =====================

  async cargarEventos(): Promise<void> {
    const reservas = await this.reservaService.obtenerReservas();
    this.reservasCache = reservas;
    this.events = reservas.map(r => ({
      id: r.id,
      start: r.start,
      end: r.end,
      text: `${r.nombre} ${r.apellido}`,
      tags: {
        nombre: r.nombre,
        apellido: r.apellido,
        telefono: r.telefono,
        correo: r.correo,
        carnet: r.carnet,
        motivo: r.motivo
      }
    }));
  }

  // =====================
  // CONSTRUCCIÓN DE FORMULARIOS
  // =====================

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
    return [
      { name: 'Fecha y Hora de la Cita', type: 'title' },
      { name: 'Fecha', id: 'fecha', type: 'date', dateFormat: 'dd/MM/yyyy' },
      { name: 'Hora inicio (ej: 09:00)', id: 'horaInicio', type: 'text' },
      { name: 'Hora fin (ej: 10:00)', id: 'horaFin', type: 'text' },
      { name: 'Datos del Paciente', type: 'title' },
      { name: 'Nombre', id: 'nombre', type: 'text' },
      { name: 'Apellido', id: 'apellido', type: 'text' },
      { name: 'Teléfono', id: 'telefono', type: 'text' },
      { name: 'Correo', id: 'correo', type: 'text' },
      { name: 'Carnet', id: 'carnet', type: 'text' },
      { name: 'Motivo de consulta', id: 'motivo', type: 'textarea', height: 60 }
    ];
  }

  // =====================
  // VALIDACIÓN
  // =====================

  private validarFormularioReserva(result: any): { start: string; end: string; nombre: string; apellido: string; telefono: string; correo: string; carnet: string; motivo: string } | null {
    // Validar campos obligatorios
    if (!result.nombre?.trim() || !result.apellido?.trim() || !result.telefono?.trim() ||
        !result.correo?.trim() || !result.carnet?.trim() || !result.motivo?.trim() ||
        !result.fecha || !result.horaInicio || !result.horaFin) {
      void this.alertaService.error('Todos los campos son obligatorios.');
      return null;
    }

    // Validar formato de hora
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!horaRegex.test(result.horaInicio) || !horaRegex.test(result.horaFin)) {
      void this.alertaService.error('Formato de hora inválido. Use HH:MM (ej: 09:00).');
      return null;
    }

    // Construir fechas ISO y validar fin de semana
    const soloFecha = new DayPilot.Date(result.fecha).toString('yyyy-MM-dd');
    if (this.diaService.esFinDeSemana(soloFecha)) {
      void this.alertaService.error('No se pueden agendar turnos los sábados ni domingos.');
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

  // =====================
  // ESTILIZACIÓN
  // =====================

  private estilizarEvento(args: any): void {
    args.data.backColor = ESTILOS_EVENTO.FONDO;
    args.data.fontColor = ESTILOS_EVENTO.TEXTO;
    args.data.borderColor = ESTILOS_EVENTO.BORDE;
    args.data.barHidden = true;
    args.data.areas = [
      {
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        text: '✕',
        fontColor: ESTILOS_EVENTO.TEXTO,
        action: 'None',
        toolTip: 'Cancelar turno',
        visibility: 'Hover',
        onClick: async (areaArgs: any) => {
          const reserva = await this.reservaService.obtenerReservaPorId(areaArgs.source.id() as string);
          if (reserva && await this.alertaService.confirmar(`¿Cancelar turno de ${reserva.nombre} ${reserva.apellido}?`, 'Sí, Cancelar', 'No, Mantener')) {
            await this.reservaService.eliminarReserva(reserva.id);
            await this.cargarEventos();
            await this.alertaService.info(`Turno eliminado.\n\nComuníquese con ${reserva.nombre} ${reserva.apellido} para informar.\nTeléfono: ${reserva.telefono}`);
          }
        },
        style: ESTILOS_EVENTO.BOTON_HOVER
      }
    ];
  }

  private estilizarColumna(args: any): void {
    const dia = new DayPilot.Date(args.column.start).getDayOfWeek();
    if (this.diaService.esFinDeSemana(new DayPilot.Date(args.column.start))) {
      args.header.backColor = '#f0f0f0';
    }
  }

  // =====================
  // UTILIDADES
  // =====================

  private registrarLocaleEspanol(): void {
    DayPilot.Locale.register(
      new DayPilot.Locale('es-es', {
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        timePattern: 'HH:mm',
        datePattern: 'dd/MM/yyyy',
        dateTimePattern: 'dd/MM/yyyy HH:mm',
        timeFormat: 'Clock24Hours',
        weekStarts: 1
      })
    );
  }

  irAHoy(): void {
    this.calendarConfig.startDate = DayPilot.Date.today();
    this.navigatorRef.control.select(DayPilot.Date.today());
    void this.cargarEventos();
  }

  async crearReservaManual(): Promise<void> {
    const form = this.construirFormularioCrear();
    const today = DayPilot.Date.today();
    const data = {
      fecha: today.toString('yyyy-MM-dd'),
      horaInicio: '09:00',
      horaFin: '10:00',
      nombre: '',
      apellido: '',
      telefono: '',
      correo: '',
      carnet: '',
      motivo: ''
    };

    const modal = await DayPilot.Modal.form(form, data, {
      theme: 'modal_default',
      okText: 'Crear Reserva',
      cancelText: 'Cancelar',
      width: 450
    });

    if (modal.canceled) return;

    const datosValidados = this.validarFormularioReserva(modal.result);
    if (!datosValidados) return;

    if (!this.disponibilidadService.verificar(datosValidados.start, datosValidados.end, this.reservasCache)) {
      await this.alertaService.error('Este horario ya está ocupado.');
      return;
    }

    await this.reservaService.crearReserva({
      start: datosValidados.start,
      end: datosValidados.end,
      nombre: datosValidados.nombre,
      apellido: datosValidados.apellido,
      telefono: datosValidados.telefono,
      correo: datosValidados.correo,
      carnet: datosValidados.carnet,
      motivo: datosValidados.motivo
    });

    await this.cargarEventos();
    await this.alertaService.exito('Reserva creada exitosamente.');
  }
}
