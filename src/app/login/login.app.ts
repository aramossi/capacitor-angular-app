
// Importaciones principales de Angular y servicios propios
import { Component } from "@angular/core";
import { FormsModule } from '@angular/forms'; // Para formularios reactivos
import { CommonModule } from '@angular/common'; // Funcionalidades comunes de Angular
import { Router } from '@angular/router'; // Navegación entre rutas
import { AuthService } from '../auth.service'; // Servicio de autenticación
import { UserService } from '../user.service'; // Servicio para usuarios en Firestore

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    styleUrls: ['./login.app.css'],
    templateUrl: './login.app.html'
})
export class LoginPageApp {
    // Variables para el formulario de login
    email: string = '';
    password: string = '';
    errorMsg: string = '';

    // Inyectamos los servicios necesarios: Router para navegación, AuthService para login y UserService para datos de usuario
    constructor(private router: Router, private authService: AuthService, private userService: UserService) { }

    /**
     * Navega a la pantalla de registro cuando el usuario hace clic en "Registrarse"
     */
    onRegister(event: Event) {
        event.preventDefault(); // Evita el comportamiento por defecto del formulario
        this.router.navigate(['/register']); // Redirige a la ruta de registro
    }

    /**
     * Maneja el proceso de login del usuario
     * - Valida campos
     * - Llama al servicio de autenticación
     * - Busca el usuario en Firestore
     * - Redirige según el tipo de usuario (dj, promotor, cliente)
     * - Muestra mensajes de error si ocurre algún problema
     */
    async onLogin(event: Event) {
        event.preventDefault(); // Evita recarga de página
        this.errorMsg = '';
        // Validación básica de campos
        if (!this.email || !this.password) {
            this.errorMsg = 'Completa todos los campos.';
            return;
        }
        try {
            // Autenticación con Firebase Auth
            await this.authService.login(this.email, this.password);
            // Buscar el usuario en Firestore y redirigir según tipo
            const user = await this.userService.getUserByEmail(this.email);
            if (user && user.tipo) {
                // Redirección según el tipo de usuario
                if (user.tipo === 'dj') {
                    this.router.navigate(['/homedj']);
                } else if (user.tipo === 'promotor') {
                    this.router.navigate(['/homepromotor']);
                } else if (user.tipo === 'cliente') {
                    this.router.navigate(['/homecliente']);
                } else {
                    this.router.navigate(['/home']);
                }
            } else {
                // Si no se encuentra el usuario, redirige a home genérico
                this.router.navigate(['/home']);
            }
        } catch (err: unknown) {
            // Manejo de errores de autenticación
            let msg = 'Error al iniciar sesión. Intenta de nuevo.';
            const error = err as { code?: string };
            if (error && typeof error === 'object' && error.code) {
                if (error.code === 'auth/wrong-password') {
                    msg = 'Contraseña incorrecta.';
                } else if (error.code === 'auth/user-not-found') {
                    msg = 'El usuario no está registrado.';
                } else if (error.code === 'auth/invalid-email') {
                    msg = 'El correo no es válido.';
                }
            }
            this.errorMsg = msg;
        }
    }
}
