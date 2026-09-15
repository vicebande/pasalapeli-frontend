import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/usuario.model';
import { environment } from '../../../environments/environment';
import { TerminosComponent } from '../terminos/terminos.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, TerminosComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public currentUser: UserProfile | null = null;
  public isAzureEnabled = environment.azureAd.enabled;
  public mostrarTerminos = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  public login(): void {
    this.mostrarTerminos = true;
  }

  public aceptarTerminos(): void {
    this.mostrarTerminos = false;
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
