import { DayPilot } from '@daypilot/daypilot-lite-angular';

export function obtenerConfiguracionCalendario(): DayPilot.CalendarConfig {
  return {
    viewType: 'Week',
    locale: 'es-es',
    startDate: DayPilot.Date.today(),
    headerDateFormat: 'ddd d/M',
    cellHeight: 30,
    businessBeginsHour: 8,
    businessEndsHour: 20,
    heightSpec: 'BusinessHoursNoScroll',
    timeFormat: 'Clock24Hours',
    eventMoveHandling: 'Update',
    eventResizeHandling: 'Update',
    timeRangeSelectedHandling: 'Enabled',
    durationBarVisible: false,
    eventBorderRadius: 6
  };
}

export const ESTILOS_EVENTO = {
  FONDO: '#4A90D9',
  TEXTO: '#ffffff',
  BORDE: '#3570B0',
  BOTON_HOVER: 'cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); border-radius:50%;'
};

export function obtenerConfiguracionNavigator(): DayPilot.NavigatorConfig {
  return {
    showMonths: 1,
    skipMonths: 1,
    selectMode: 'Week',
    locale: 'es-es',
    theme: 'navigator_default',
    cellWidth: 30,
    cellHeight: 30,
    titleHeight: 36,
    dayHeaderHeight: 30
  };
}
