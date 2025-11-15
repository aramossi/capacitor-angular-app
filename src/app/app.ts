// Componente raíz de la aplicación Angular
// Este componente es el punto de entrada de toda la app.
// Aquí se define el router-outlet, que es donde se mostrarán las páginas según la ruta.

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root', // Selector principal, usado en index.html
  standalone: true, // Indica que es un componente standalone (sin módulo)
  imports: [RouterOutlet], // Importa el RouterOutlet para navegación
  templateUrl: './app.html', // HTML asociado
  styleUrl: './app.css' // CSS global de la app
})
export class App {
  // Variable de ejemplo para el título de la app (no es obligatoria)
  protected readonly title = signal('capacitor-angular');
}