
// Este archivo define las rutas principales de la aplicación.
// Cada objeto en el array 'routes' representa una URL y el componente que se debe mostrar.
// Por ejemplo, si el usuario navega a '/homedj', se muestra el componente HomeDjPageApp.

import { Routes } from '@angular/router';
import { LoginPageApp } from './login/login.app';
import { RegisterPageApp } from './register/register.app';
import { HomeDjPageApp } from './homedj/homedj.app';
import { DjPerfilComponent } from './dj-perfil/dj-perfil.app';
import { HomePromotorPageApp } from './homepromotor/homepromotor.app';
import { HomeClientePageApp } from './homecliente/homecliente.app';
import { NotificacionesPageApp } from './notificaciones/notificaciones.app';

export const routes: Routes = [
    {
        path: '', // Ruta raíz, muestra el login
        component: LoginPageApp,
    },
    {
        path: 'home', // Ruta alternativa para DJ (puedes unificar con homedj)
        component: HomeDjPageApp,
    },
    {
        path: 'homedj', // Home específico para DJ
        component: HomeDjPageApp,
    },
    {
        path: 'homepromotor', // Home para promotor
        component: HomePromotorPageApp,
    },
    {
        path: 'homecliente', // Home para cliente
        component: HomeClientePageApp,
    },
    {
        path: 'register', // Registro de usuario
        component: RegisterPageApp,
    },
    {
        path: 'perfil', // Perfil de DJ
        component: DjPerfilComponent,
    },
    {
        path: 'notificaciones', // Notificaciones
        component: NotificacionesPageApp,
    },
];
