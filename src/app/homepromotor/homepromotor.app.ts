import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, query, where, doc, getDoc, setDoc, addDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { UserData, CalendarDayData } from '../models/user.model';
import { UserService } from '../user.service';

@Component({
    standalone: true,
    selector: 'app-homepromotor',
    templateUrl: './homepromotor.app.html',
    styleUrls: ['./homepromotor.app.css'],
    imports: [CommonModule, FormsModule]
})
export class HomePromotorPageApp implements OnInit {
    djs: UserData[] = [];
    cargando: boolean = true;
    nombrePromotor: string = '';
    empresaPromotor: string = '';

    // Formulario de propuesta
    propuestaVisible: boolean = false;
    tipoEvento: string = '';
    fechaEvento: string = '';
    lugarEvento: string = '';
    presupuesto: string = '';
    detallesEvento: string = '';
    horaInicio: string = '';
    horaFin: string = '';
    personasEstimadas: string = '';
    telefonoContacto: string = '';
    mensajePropuesta: string = '';
    errorPropuesta: string = '';

    // Variables para el calendario del DJ seleccionado
    djSeleccionado: UserData | null = null;
    calendarioVisible: boolean = false;
    meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    diasSemana = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    mesActual: number = new Date().getMonth();
    anioActual: number = new Date().getFullYear();
    diasMes: CalendarDayData[] = [];
    estadosDias: { [key: string]: 'available' | 'busy' | 'tentative' | undefined } = {};

    // Filtros y búsqueda
    filtroGenero: string = '';
    busquedaNombre: string = '';
    generosDisponibles: string[] = [];

    private router = inject(Router);
    private firestore = inject(Firestore);
    private auth = inject(Auth);
    private userService = inject(UserService);

    async ngOnInit() {
        // Obtener datos del promotor logueado
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                const userData = await this.userService.getUserByEmail(user.email || '');
                if (userData) {
                    this.nombrePromotor = userData.nombre || 'Promotor';
                    this.empresaPromotor = userData.empresa || '';
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
                calendarioIds.add(calDoc.id);
            }
        });

        // Ahora cargar solo los usuarios DJs que tienen calendarios
        const djsConCalendario = [];
        const generosSet = new Set<string>();

        for (const uid of calendarioIds) {
            const userDocRef = doc(this.firestore, 'users', uid);
            const userSnap = await getDoc(userDocRef);
            if (userSnap.exists()) {
                const userData = userSnap.data() as UserData;
                if (userData.tipo === 'dj') {
                    djsConCalendario.push({
                        ...userData,
                        id: uid
                    } as UserData);

                    // Agregar géneros al set (generos es un string separado por comas)
                    if (userData.generos) {
                        const generosString = String(userData.generos);
                        const generosArray = generosString.split(',');
                        generosArray.forEach((g: string) => {
                            const generoNormalizado = g.trim().toLowerCase();
                            if (generoNormalizado) {
                                generosSet.add(generoNormalizado);
                            }
                        });
                    }
                }
            }
        }

        this.djs = djsConCalendario;
        // Capitalizar la primera letra de cada género y ordenar
        this.generosDisponibles = Array.from(generosSet)
            .map(g => g.charAt(0).toUpperCase() + g.slice(1))
            .sort();
        this.cargando = false;
    }

    get djsFiltrados() {
        return this.djs.filter((dj: UserData) => {
            const generosString = dj.generos ? String(dj.generos) : '';
            const coincideGenero = !this.filtroGenero ||
                (generosString && generosString.toLowerCase().includes(this.filtroGenero.toLowerCase()));

            const nombreString = dj.nombreArtistico ? String(dj.nombreArtistico) : '';
            const coincideNombre = !this.busquedaNombre ||
                (nombreString && nombreString.toLowerCase().includes(this.busquedaNombre.toLowerCase()));

            return coincideGenero && coincideNombre;
        });
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

        if (dj.id) {
            const calDoc = doc(this.firestore, 'calendarios', dj.id);
            const calSnap = await getDoc(calDoc);
            if (calSnap.exists()) {
                const data = calSnap.data();
                this.estadosDias = data['estadosDias'] || {};
            } else {
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

    enviarPropuesta(dj: UserData) {
        this.djSeleccionado = dj;
        this.propuestaVisible = true;
        this.mensajePropuesta = '';
        this.errorPropuesta = '';
    }

    cerrarPropuesta() {
        this.propuestaVisible = false;
        this.djSeleccionado = null;
        this.tipoEvento = '';
        this.fechaEvento = '';
        this.lugarEvento = '';
        this.presupuesto = '';
        this.detallesEvento = '';
        this.horaInicio = '';
        this.horaFin = '';
        this.personasEstimadas = '';
        this.telefonoContacto = '';
    }

    async guardarPropuesta() {
        if (!this.tipoEvento || !this.fechaEvento || !this.lugarEvento || !this.telefonoContacto || !this.presupuesto) {
            this.errorPropuesta = 'Por favor completa todos los campos obligatorios.';
            return;
        }

        if (!this.djSeleccionado?.id) {
            this.errorPropuesta = 'Error al identificar al DJ.';
            return;
        }

        try {
            const propuestaCollection = collection(this.firestore, 'solicitudes');
            await addDoc(propuestaCollection, {
                djId: this.djSeleccionado.id,
                nombreCliente: this.nombrePromotor,
                empresa: this.empresaPromotor,
                tipoEvento: this.tipoEvento,
                fechaEvento: this.fechaEvento,
                lugarEvento: this.lugarEvento,
                presupuesto: this.presupuesto,
                horaInicio: this.horaInicio || 'No especificada',
                horaFin: this.horaFin || 'No especificada',
                personasEstimadas: this.personasEstimadas || 'No especificado',
                detallesEvento: this.detallesEvento || 'Sin detalles adicionales',
                telefono: this.telefonoContacto,
                fecha: new Date(),
                leido: false,
                tipoSolicitud: 'promotor'
            });

            this.mensajePropuesta = '¡Propuesta enviada con éxito! El DJ evaluará tu solicitud pronto.';
            this.errorPropuesta = '';

            setTimeout(() => {
                this.cerrarPropuesta();
            }, 2000);
        } catch (error) {
            console.error('Error al enviar propuesta:', error);
            this.errorPropuesta = 'Error al enviar la propuesta. Intenta nuevamente.';
        }
    }

    limpiarFiltros() {
        this.filtroGenero = '';
        this.busquedaNombre = '';
    }
}
