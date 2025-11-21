import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

interface Notificacion {
    id?: string;
    nombreCliente?: string;
    telefono?: string;
    mensaje?: string;
    fecha?: Date;
    leido?: boolean;
}

@Component({
    selector: 'app-notificaciones',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './notificaciones.app.html',
    styleUrls: ['./notificaciones.app.css']
})
export class NotificacionesPageApp implements OnInit {
    notificaciones: Notificacion[] = [];
    agendasGuardadas: { [key: string]: any } = {};
    cargando: boolean = true;
    userId: string = '';

    private router = inject(Router);
    private firestore = inject(Firestore);
    private auth = inject(Auth);

    ngOnInit() {
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                this.userId = user.uid;
                await this.cargarNotificaciones();
            }
        });
    }

    async cargarNotificaciones() {
        this.cargando = true;

        // Cargar agendas guardadas
        const agendasDoc = doc(this.firestore, 'agendas', this.userId);
        const agendasSnap = await getDoc(agendasDoc);
        if (agendasSnap.exists()) {
            this.agendasGuardadas = agendasSnap.data()["agendas"] || {};
        }

        // Convertir agendas a notificaciones
        this.notificaciones = Object.entries(this.agendasGuardadas).map(([fecha, agenda]: [string, any]) => ({
            id: fecha,
            nombreCliente: agenda.persona,
            telefono: agenda.telefono,
            mensaje: `Fecha: ${fecha}${agenda.direccion ? '\nDirección: ' + agenda.direccion : ''}${agenda.descripcion ? '\nDescripción: ' + agenda.descripcion : ''}`
        }));

        this.cargando = false;
    }

    async eliminarNotificacion(index: number) {
        const notif = this.notificaciones[index];
        if (notif.id) {
            delete this.agendasGuardadas[notif.id];

            // Guardar en Firestore
            if (this.userId) {
                const agendasDoc = doc(this.firestore, 'agendas', this.userId);
                await setDoc(agendasDoc, { agendas: this.agendasGuardadas });
            }

            this.notificaciones.splice(index, 1);
        }
    }

    irHome() {
        this.router.navigate(['/homedj']);
    }

    irPerfil() {
        this.router.navigate(['/perfil']);
    }

    cerrarSesion() {
        this.router.navigate(['/']);
    }
}
