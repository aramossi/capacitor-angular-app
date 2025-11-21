import { Component, inject } from '@angular/core';
import { CalendarDay, Paquete, Notificacion } from '../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['./homedj.app.css'],
    templateUrl: './homedj.app.html'
})
export class HomeDjPageApp {
    menuAbierto = false;
    meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    fechaActual = new Date();
    mes: number = this.fechaActual.getMonth();
    anio: number = this.fechaActual.getFullYear();
    diasMes: CalendarDay[] = [];
    estadosDias: { [key: string]: 'available' | 'busy' | 'tentative' | undefined } = {};
    estadoSeleccionado: 'available' | 'busy' | 'tentative' = 'available';
    paquetes: Paquete[] = [];
    editando: number | null = null;
    cargando: boolean = true;
    userId: string = '';
    // Notificaciones de contacto de clientes
    notificaciones: Notificacion[] = [];

    // Agenda para días ocupados y propuestas
    agendaFormVisible: boolean = false;
    agendaFecha: string = '';
    agendaDireccion: string = '';
    agendaPersona: string = '';
    agendaTelefono: string = '';
    agendaDescripcion: string = '';
    agendaTipoFormulario: 'busy' | 'tentative' | null = null;
    agendasGuardadas: { [key: string]: any } = {};

    private router = inject(Router);
    private firestore = inject(Firestore);
    private auth = inject(Auth);

    ngOnInit() {
        this.generarDiasMes();
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                this.userId = user.uid;
                await this.cargarDatosUsuario();
            }
        });
    }

    async cargarDatosUsuario() {
        this.cargando = true;
        // Calendario
        const calDoc = doc(this.firestore, 'calendarios', this.userId);
        const calSnap = await getDoc(calDoc);
        if (calSnap.exists()) {
            this.estadosDias = calSnap.data()["estadosDias"] || {};
        } else {
            this.estadosDias = {};
        }
        // Paquetes
        const packDoc = doc(this.firestore, 'paquetes', this.userId);
        const packSnap = await getDoc(packDoc);
        if (packSnap.exists()) {
            this.paquetes = packSnap.data()["paquetes"] || [];
        } else {
            this.paquetes = [
                { icon: '🎵', titulo: 'Standard Wedding Package', precio: '$1,200' },
                { icon: '🎧', titulo: 'Club Night', precio: '$800' },
                { icon: '🏢', titulo: 'Corporate Event', precio: '$1,500' }
            ];
        }
        // Notificaciones de contacto
        const notifDoc = doc(this.firestore, 'notificaciones', this.userId);
        const notifSnap = await getDoc(notifDoc);
        if (notifSnap.exists()) {
            this.notificaciones = notifSnap.data()["notificaciones"] || [];
        } else {
            this.notificaciones = [];
        }
        // Agendas guardadas
        const agendasDoc = doc(this.firestore, 'agendas', this.userId);
        const agendasSnap = await getDoc(agendasDoc);
        if (agendasSnap.exists()) {
            this.agendasGuardadas = agendasSnap.data()["agendas"] || {};
        } else {
            this.agendasGuardadas = {};
        }
        this.cargando = false;
    }

    irHome() {
        this.menuAbierto = false;
        this.router.navigate(['/home']);
    }

    cerrarSesion() {
        this.menuAbierto = false;
        // if (this.authService.logout) this.authService.logout();
        this.router.navigate(['/']);
    }

    irPerfil() {
        this.menuAbierto = false;
        this.router.navigate(['/perfil']);
    }

    irNotificaciones() {
        this.menuAbierto = false;
        this.router.navigate(['/notificaciones']);
    }

    generarDiasMes() {
        this.diasMes = [];
        const primerDia = new Date(this.anio, this.mes, 1);
        const ultimoDia = new Date(this.anio, this.mes + 1, 0);
        const primerDiaSemana = primerDia.getDay();
        for (let i = 0; i < primerDiaSemana; i++) {
            this.diasMes.push({ num: 0, key: '' });
        }
        for (let d = 1; d <= ultimoDia.getDate(); d++) {
            this.diasMes.push({
                num: d,
                key: `${this.anio}-${this.mes + 1}-${d}`
            });
        }
    }

    cambiarMes(delta: number) {
        this.mes += delta;
        if (this.mes < 0) {
            this.mes = 11;
            this.anio--;
        } else if (this.mes > 11) {
            this.mes = 0;
            this.anio++;
        }
        this.generarDiasMes();
    }

    getDayClass(day: CalendarDay | null) {
        if (!day) return 'calendar-day';
        const key = day.key;
        const estado = this.estadosDias[key];
        if (estado === 'busy') return 'calendar-day day-busy';
        if (estado === 'available') return 'calendar-day day-available';
        if (estado === 'tentative') return 'calendar-day day-tentative';
        const hoy = new Date();
        if (
            day.num === hoy.getDate() &&
            this.mes === hoy.getMonth() &&
            this.anio === hoy.getFullYear()
        ) {
            return 'calendar-day day-today';
        }
        return 'calendar-day';
    }

    seleccionarEstado(estado: 'available' | 'busy' | 'tentative') {
        this.estadoSeleccionado = estado;
    }

    async pintarDia(day: CalendarDay | null) {
        if (!day) return;
        const key = day.key;

        // Si el día ya tiene un estado y se hace clic en él, mostrar la información guardada
        if (this.estadosDias[key] && this.agendasGuardadas[key]) {
            this.agendaFecha = key;
            const agenda = this.agendasGuardadas[key];
            this.agendaPersona = agenda.persona || '';
            this.agendaTelefono = agenda.telefono || '';
            this.agendaDireccion = agenda.direccion || '';
            this.agendaDescripcion = agenda.descripcion || '';
            this.agendaTipoFormulario = this.estadosDias[key] as 'busy' | 'tentative';
            this.agendaFormVisible = true;
            return;
        }

        if (this.estadosDias[key] === this.estadoSeleccionado) {
            this.estadosDias[key] = undefined;
            delete this.agendasGuardadas[key];
        } else {
            this.estadosDias[key] = this.estadoSeleccionado;
        }
        // Guardar en Firestore
        if (this.userId) {
            const calDoc = doc(this.firestore, 'calendarios', this.userId);
            await setDoc(calDoc, { estadosDias: this.estadosDias });
        }

        // Si el estado es ocupado o tentativo, mostrar formulario de agenda
        if (this.estadoSeleccionado === 'busy' || this.estadoSeleccionado === 'tentative') {
            this.agendaFormVisible = true;
            this.agendaFecha = key;
            this.agendaTipoFormulario = this.estadoSeleccionado;
            // Limpiar campos para nueva entrada
            this.agendaPersona = '';
            this.agendaTelefono = '';
            this.agendaDireccion = '';
            this.agendaDescripcion = '';
        }
    }

    async guardarAgenda() {
        const agendaInfo: any = {
            fecha: this.agendaFecha,
            persona: this.agendaPersona,
            telefono: this.agendaTelefono,
            descripcion: this.agendaDescripcion
        };

        // Solo agregar dirección si es tipo 'busy'
        if (this.agendaTipoFormulario === 'busy') {
            agendaInfo.direccion = this.agendaDireccion;
        }

        // Guardar en agendasGuardadas
        this.agendasGuardadas[this.agendaFecha] = agendaInfo;

        // Guardar en Firestore
        if (this.userId) {
            const agendasDoc = doc(this.firestore, 'agendas', this.userId);
            await setDoc(agendasDoc, { agendas: this.agendasGuardadas });
        }

        // Limpiar y ocultar formulario
        this.agendaFormVisible = false;
        this.agendaFecha = '';
        this.agendaDireccion = '';
        this.agendaPersona = '';
        this.agendaTelefono = '';
        this.agendaDescripcion = '';
        this.agendaTipoFormulario = null;
    }

    async agregarPaquete() {
        this.paquetes.push({ icon: '🎉', titulo: 'Nuevo Paquete', precio: '$0' });
        await this.guardarPaquetes();
    }

    async eliminarPaquete(index: number) {
        this.paquetes.splice(index, 1);
        await this.guardarPaquetes();
    }

    editarPaquete(i: number) {
        this.editando = i;
    }

    async guardarPaquete() {
        this.editando = null;
        await this.guardarPaquetes();
    }

    async guardarPaquetes() {
        if (this.userId) {
            const packDoc = doc(this.firestore, 'paquetes', this.userId);
            await setDoc(packDoc, { paquetes: this.paquetes });
        }
    }

    async eliminarNotificacion(index: number) {
        this.notificaciones.splice(index, 1);
        if (this.userId) {
            const notifDoc = doc(this.firestore, 'notificaciones', this.userId);
            await setDoc(notifDoc, { notificaciones: this.notificaciones });
        }
    }
}
