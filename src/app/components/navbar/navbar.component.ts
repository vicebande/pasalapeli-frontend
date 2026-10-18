import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';
import { TerminosComponent } from '../terminos/terminos.component';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';

const TERMINOS_ACEPTADOS_KEY = 'plp_terminos_aceptados';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TerminosComponent, NotificacionesComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public currentUser: UserProfile | null = null;
  public isAzureEnabled = environment.azureAd.enabled;
  public mostrarTerminos = false;
  public menuAbierto = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  public toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  public cerrarMenu(): void {
    this.menuAbierto = false;
  }

  public login(): void {
    // Si ya aceptó los términos una vez, no se vuelve a mostrar el modal.
    if (localStorage.getItem(TERMINOS_ACEPTADOS_KEY) === 'true') {
      this.authService.login();
      return;
    }
    this.mostrarTerminos = true;
  }

  public aceptarTerminos(): void {
    this.mostrarTerminos = false;
    localStorage.setItem(TERMINOS_ACEPTADOS_KEY, 'true');
    this.authService.login();
  }

  public cerrarTerminos(): void {
    this.mostrarTerminos = false;
  }

  public logout(): void {
    this.authService.logout();
  }

  public toggleRole(): void {
    this.authService.toggleDemoRole();
  }
}
