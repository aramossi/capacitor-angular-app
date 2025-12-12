import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, query, where, doc, getDoc, setDoc, addDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { UserData, CalendarDayData } from '../models/user.model';
import { UserService } from '../user.service';
import { Capacitor } from '@capacitor/core';

@Component({
    standalone: true,
    selector: 'app-homecliente',
    templateUrl: './homecliente.app.html',
    styleUrls: ['./homecliente.app.css'],
    imports: [CommonModule, FormsModule]
})
export class HomeClientePageApp implements OnInit {
    djs: UserData[] = [];
    cargando: boolean = true;
    nombreCliente: string = '';

    // Formulario de contacto
    formularioVisible: boolean = false;
    tipoEvento: string = '';
    fechaEvento: string = '';
    telefonoCliente: string = '';
    mensajeContacto: string = '';
    errorContacto: string = '';

    // Variables para el calendario del DJ seleccionado
    djSeleccionado: UserData | null = null;
    calendarioVisible: boolean = false;
    meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    mesActual: number = new Date().getMonth();
    anioActual: number = new Date().getFullYear();
    diasMes: CalendarDayData[] = [];
    estadosDias: { [key: string]: 'available' | 'busy' | 'tentative' | undefined } = {};

    private router = inject(Router);
    private firestore = inject(Firestore);
    private auth = inject(Auth);
    private userService = inject(UserService);

    getDefaultAvatar(): string {
        if (Capacitor.isNativePlatform()) {
            return Capacitor.convertFileSrc('assets/avatar-dj-default.jpg');
        }
        return 'assets/avatar-dj-default.jpg';
    }

    async ngOnInit() {
        // Obtener datos del cliente logueado
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                const userData = await this.userService.getUserByEmail(user.email || '');
                if (userData) {
                    this.nombreCliente = userData.nombre || 'Cliente';
                }
            }
        });

        await this.cargarDJs();
    }

    async cargarDJs() {
        this.cargando = true;

        // Primero obtener todos los calendarios disponibles
        const calendariosRef = collection(this.firestore, 'calendarios');
        const calSnapshot = await getDocs(calendariosRef);
        const calendarioIds = new Set<string>();

        // Guardar los UIDs que tienen calendarios con fechas
        calSnapshot.docs.forEach(calDoc => {
            const estadosDias = calDoc.data()['estadosDias'];
            if (estadosDias && Object.keys(estadosDias).length > 0) {
                calendarioIds.add(calDoc.id); // El ID del calendario ES el UID del usuario
            }
        });

        console.log('UIDs con calendarios configurados:', Array.from(calendarioIds)); // Debug

        // Ahora cargar solo los usuarios DJs que tienen calendarios
        const djsConCalendario = [];
        for (const uid of calendarioIds) {
            const userDocRef = doc(this.firestore, 'users', uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                const userData = userSnap.data() as UserData;
                if (userData.tipo === 'dj') {
                    djsConCalendario.push({
                        ...userData,
                        id: uid  // Usar el UID como ID
                    } as UserData);
                }
            }
        }

        this.djs = djsConCalendario;
        console.log('DJs con calendarios configurados:', this.djs); // Debug
        this.cargando = false;
    }

    irHome() {
        this.router.navigate(['/']);
    }

    cerrarSesion() {
        this.router.navigate(['/']);
    }

    async verCalendario(dj: UserData) {
        this.djSeleccionado = dj;
        this.calendarioVisible = true;

        // Cargar el calendario del DJ desde Firestore
        // El id del documento de usuario es el mismo que el uid de Auth
        if (dj.id) {
            console.log('Buscando calendario para DJ con ID:', dj.id); // Debug
            const calDoc = doc(this.firestore, 'calendarios', dj.id);
            const calSnap = await getDoc(calDoc);
            if (calSnap.exists()) {
                const data = calSnap.data();
                console.log('Datos del calendario encontrados:', data); // Debug
                this.estadosDias = data['estadosDias'] || {};
                console.log('Estados de días cargados:', this.estadosDias); // Debug
            } else {
                console.log('No se encontró calendario para este DJ'); // Debug
                this.estadosDias = {};
            }
        }

        this.generarDiasMes();
    }

    generarDiasMes() {
        this.diasMes = [];
        const primerDia = new Date(this.anioActual, this.mesActual, 1);
        const ultimoDia = new Date(this.anioActual, this.mesActual + 1, 0);
        const primerDiaSemana = primerDia.getDay();

        for (let i = 0; i < primerDiaSemana; i++) {
            this.diasMes.push({ num: 0, key: '' });
        }

        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            this.diasMes.push({
                num: d,
                key: `${this.anioActual}-${this.mesActual + 1}-${d}`
            });
        }
    }

    cambiarMes(direccion: number) {
        this.mesActual += direccion;
        if (this.mesActual > 11) {
            this.mesActual = 0;
            this.anioActual++;
        } else if (this.mesActual < 0) {
            this.mesActual = 11;
            this.anioActual--;
        }
        this.generarDiasMes();
    }

    getDayClass(day: CalendarDayData) {
        if (!day || day.num === 0) return 'calendar-day';
        const key = day.key;
        const estado = this.estadosDias[key];
        if (estado === 'busy') return 'calendar-day day-busy';
        if (estado === 'available') return 'calendar-day day-available';
        if (estado === 'tentative') return 'calendar-day day-tentative';

        const hoy = new Date();
        if (
            day.num === hoy.getDate() &&
            this.mesActual === hoy.getMonth() &&
            this.anioActual === hoy.getFullYear()
        ) {
            return 'calendar-day day-today';
        }
        return 'calendar-day';
    }

    cerrarCalendario() {
        this.calendarioVisible = false;
        this.djSeleccionado = null;
    }

    contactarDJ(dj: UserData) {
        this.djSeleccionado = dj;
        this.formularioVisible = true;
        this.mensajeContacto = '';
        this.errorContacto = '';
    }

    cerrarFormulario() {
        this.formularioVisible = false;
        this.djSeleccionado = null;
        this.tipoEvento = '';
        this.fechaEvento = '';
        this.telefonoCliente = '';
    }

    async enviarSolicitud() {
        if (!this.tipoEvento || !this.fechaEvento || !this.telefonoCliente) {
            this.errorContacto = 'Por favor completa todos los campos.';
            return;
        }

        if (!this.djSeleccionado?.id) {
            this.errorContacto = 'Error al identificar al DJ.';
            return;
        }

        try {
            // Guardar solicitud en colección de notificaciones del DJ
            const notifCollection = collection(this.firestore, 'solicitudes');
            await addDoc(notifCollection, {
                djId: this.djSeleccionado.id,
                nombreCliente: this.nombreCliente,
                tipoEvento: this.tipoEvento,
                fechaEvento: this.fechaEvento,
                telefono: this.telefonoCliente,
                fecha: new Date(),
                leido: false
            });

            this.mensajeContacto = '¡Solicitud enviada con éxito! El DJ se comunicará contigo pronto.';
            this.errorContacto = '';

            // Limpiar formulario después de 2 segundos
            setTimeout(() => {
                this.cerrarFormulario();
            }, 2000);
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            this.errorContacto = 'Error al enviar la solicitud. Intenta nuevamente.';
        }
    }
}
