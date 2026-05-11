import { Component } from '@angular/core';
import { CalendarioComponent } from './widgets/calendario/calendario.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CalendarioComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
