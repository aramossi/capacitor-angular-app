
// Configuración global de la aplicación Angular
// Aquí se definen los providers principales: rutas, Firebase, Firestore, Auth, etc.
// Este archivo es esencial para inicializar los servicios y dependencias de la app.

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // Manejo global de errores
    provideZoneChangeDetection({ eventCoalescing: true }), // Optimización de detección de cambios
    provideRouter(routes), // Proveedor de rutas (routing)
    provideFirebaseApp(() => initializeApp(environment.firebase)), // Inicializa Firebase con tu config
    provideFirestore(() => getFirestore()), // Proveedor de Firestore (base de datos)
    provideAuth(() => getAuth()), // Proveedor de autenticación Firebase
    importProvidersFrom(CommonModule) // Importa funcionalidades comunes de Angular
  ]
};
