import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc, setDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Capacitor } from '@capacitor/core';

import { Solicitud, Evento, AgendaGuardada } from '../models/user.model';

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
    solicitudes: Solicitud[] = [];
    eventos: Evento[] = [];
    vistaActual: 'solicitudes' | 'eventos' = 'solicitudes';
    agendasGuardadas: { [key: string]: AgendaGuardada } = {};
    cargando: boolean = true;
    userId: string = '';
    isNativePlatform: boolean = Capacitor.isNativePlatform();

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

        // Cargar solicitudes de clientes
        await this.cargarSolicitudes();

        // Cargar eventos del calendario (agendas guardadas)
        const agendasDoc = doc(this.firestore, 'agendas', this.userId);
        const agendasSnap = await getDoc(agendasDoc);
        if (agendasSnap.exists()) {
            this.agendasGuardadas = agendasSnap.data()["agendas"] || {};
        }

        // Convertir agendas a eventos
        this.eventos = Object.entries(this.agendasGuardadas).map(([fecha, agenda]: [string, any]) => ({
            id: fecha,
            fecha: fecha,
            persona: agenda.persona,
            telefono: agenda.telefono,
            direccion: agenda.direccion || '',
            descripcion: agenda.descripcion || ''
        }));

        this.cargando = false;
    }

    async cargarSolicitudes() {
        try {
            const solicitudesRef = collection(this.firestore, 'solicitudes');
            const q = query(solicitudesRef, where('djId', '==', this.userId));
            const querySnapshot = await getDocs(q);

            this.solicitudes = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
            this.solicitudes = [];
        }
    }

    async eliminarEvento(index: number) {
        const evento = this.eventos[index];
        if (evento.id) {
            delete this.agendasGuardadas[evento.id];

            // Guardar en Firestore
            if (this.userId) {
                const agendasDoc = doc(this.firestore, 'agendas', this.userId);
                await setDoc(agendasDoc, { agendas: this.agendasGuardadas });
            }

            this.eventos.splice(index, 1);
        }
    }

    cambiarVista(vista: 'solicitudes' | 'eventos') {
        this.vistaActual = vista;
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
