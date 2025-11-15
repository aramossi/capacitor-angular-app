import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { doc, updateDoc, setDoc, Firestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

    ngOnInit() {
        onAuthStateChanged(this.auth, async (user: User | null) => {
            if (user) {
                this.userId = user.uid;
                // Cargar datos del usuario por email (así están guardados en Firestore)
                const userData = await this.userService.getUserByEmail(user.email || '');
                console.log('Datos cargados desde Firestore:', userData); // Debug
                if (userData) {
                    this.firestoreDocId = userData.id || ''; // Guardar el ID del documento
                    this.userNombre = userData.nombre || '';
                    this.userApellido = userData.apellido || '';
                    this.avatarUrl = userData.avatar || '';
                    this.nombreArtistico = userData.nombreArtistico || '';
                    this.descripcion = userData.descripcion || '';
                    this.generos = userData.generos || [];
                    this.rider = userData.rider || '';
                    console.log('Nombre artístico cargado:', this.nombreArtistico); // Debug
                    console.log('Descripción cargada:', this.descripcion); // Debug
                    console.log('Géneros cargados:', this.generos); // Debug
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

    cerrarSesion() {
        this.router.navigate(['/']);
    }

    async onAvatarSelected(event: Event) {
        this.avatarMessage = '';
        this.avatarError = '';
        const target = event.target as HTMLInputElement;
        const file: File = target.files?.[0]!;
        if (!file || !this.firestoreDocId) return;
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `avatars/${this.userId}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            this.avatarUrl = url;
            // Actualizar en Firestore usando el ID del documento correcto
            const userDoc = doc(this.firestore, 'users', this.firestoreDocId);
            await setDoc(userDoc, { avatar: url }, { merge: true });
            this.avatarMessage = '¡Foto de perfil actualizada con éxito!';
        } catch (err) {
            this.avatarError = 'Error al subir la foto. Intenta nuevamente.';
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
