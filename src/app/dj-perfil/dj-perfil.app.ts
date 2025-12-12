import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { doc, setDoc, Firestore } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

@Component({
    selector: 'app-dj-perfil',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './dj-perfil.app.html',
    styleUrls: ['./dj-perfil.app.css']
})
export class DjPerfilComponent implements OnInit {
    userNombre: string = '';
    userApellido: string = '';
    avatarUrl: string = '';
    userId: string = '';
    firestoreDocId: string = ''; // ID del documento en Firestore
    avatarMessage: string = '';
    avatarError: string = '';
    nombreArtistico: string = '';
    descripcion: string = '';
    generos: string[] = [];
    nuevoGenero: string = '';
    rider: string = '';
    editandoNombreArtistico: boolean = false;
    editandoDescripcion: boolean = false;
    editandoRider: boolean = false;

    private userService = inject(UserService);
    private auth = inject(Auth);
    private firestore = inject(Firestore);

    constructor(private router: Router) { }

    getDefaultAvatar(): string {
        if (Capacitor.isNativePlatform()) {
            return Capacitor.convertFileSrc('assets/avatar-dj-default.jpg');
        }
        return 'assets/avatar-dj-default.jpg';
    }

    ngOnInit() {
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                this.userId = user.uid;
                this.firestoreDocId = user.uid; // El UID es el ID del documento
                // Cargar datos del usuario directamente por UID
                const userData = await this.userService.getUserByUid(user.uid);
                console.log('Datos cargados desde Firestore:', userData); // Debug
                if (userData) {
                    this.userNombre = userData.nombre || '';
                    this.userApellido = userData.apellido || '';
                    this.avatarUrl = userData.avatar || '';
                    this.nombreArtistico = userData.nombreArtistico || '';
                    this.descripcion = userData.descripcion || '';
                    this.generos = userData.generos || [];
                    this.rider = userData.rider || '';
                    console.log('Avatar URL cargado:', this.avatarUrl); // Debug
                    console.log('Nombre artístico cargado:', this.nombreArtistico); // Debug
                }
            }
        });
    }

    irHomeDj() {
        this.router.navigate(['/homedj']);
    }

    irPerfil() {
        this.router.navigate(['/perfil']);
    }

    irNotificaciones() {
        this.router.navigate(['/notificaciones']);
    }

    cerrarSesion() {
        this.router.navigate(['/']);
    }

    async onAvatarSelected(event: Event) {
        this.avatarMessage = '';
        this.avatarError = '';
        const target = event.target as HTMLInputElement;
        const file: File = target.files?.[0]!;
        if (!file || !this.firestoreDocId) {
            this.avatarError = 'Por favor selecciona una imagen válida.';
            return;
        }

        // Validar tamaño (máximo 1MB para Base64)
        if (file.size > 1048576) {
            this.avatarError = 'La imagen es muy grande. Máximo 1MB.';
            return;
        }

        try {
            console.log('Convirtiendo imagen a Base64...', file.name);

            // Convertir imagen a Base64
            const reader = new FileReader();
            reader.onload = async (e: ProgressEvent<FileReader>) => {
                const base64String = e.target?.result as string;
                this.avatarUrl = base64String;

                // Guardar en Firestore directamente
                const userDoc = doc(this.firestore, 'users', this.firestoreDocId);
                await setDoc(userDoc, { avatar: base64String }, { merge: true });
                console.log('Avatar guardado en Firestore');
                this.avatarMessage = '¡Foto de perfil actualizada con éxito!';
            };

            reader.onerror = () => {
                this.avatarError = 'Error al leer la imagen.';
            };

            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Error al guardar avatar:', err);
            this.avatarError = 'Error al guardar la foto. Intenta nuevamente.';
        }
    }

    async guardarPerfil() {
        if (!this.firestoreDocId) return;
        try {
            // Usar el ID del documento de Firestore (no el UID de Auth)
            const userDoc = doc(this.firestore, 'users', this.firestoreDocId);

            console.log('Guardando datos:', { // Debug
                nombreArtistico: this.nombreArtistico,
                descripcion: this.descripcion,
                generos: this.generos,
                rider: this.rider
            });

            await setDoc(userDoc, {
                nombreArtistico: this.nombreArtistico,
                descripcion: this.descripcion,
                generos: this.generos,
                rider: this.rider
            }, { merge: true });

            console.log('✅ Datos guardados exitosamente'); // Debug

            this.avatarMessage = '✅ Información guardada correctamente';
            this.avatarError = '';

            // Desactivar todos los modos de edición
            this.editandoNombreArtistico = false;
            this.editandoDescripcion = false;
            this.editandoRider = false;

            // Limpiar mensaje después de 3 segundos
            setTimeout(() => {
                this.avatarMessage = '';
            }, 3000);
        } catch (error) {
            console.error('❌ Error al guardar:', error);
            this.avatarError = '❌ Error al guardar. Intenta nuevamente.';
            this.avatarMessage = '';
        }
    }

    agregarGenero() {
        if (this.nuevoGenero.trim()) {
            this.generos.push(this.nuevoGenero.trim());
            this.nuevoGenero = '';
        }
    }

    eliminarGenero(index: number) {
        this.generos.splice(index, 1);
    }

    activarEdicion(campo: string) {
        if (campo === 'nombreArtistico') this.editandoNombreArtistico = true;
        if (campo === 'descripcion') this.editandoDescripcion = true;
        if (campo === 'rider') this.editandoRider = true;
    }

    desactivarEdicion(campo: string) {
        if (campo === 'nombreArtistico') this.editandoNombreArtistico = false;
        if (campo === 'descripcion') this.editandoDescripcion = false;
        if (campo === 'rider') this.editandoRider = false;
    }
}
