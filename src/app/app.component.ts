import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../environments/environment';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Pasa La Peli';

  constructor(private msalService: MsalService) {}

  ngOnInit(): void {
    if (environment.azureAd.enabled && this.msalService) {
      // Procesa la respuesta del flujo redirect (login/logout) al volver de Azure AD.
      // En apps standalone reemplaza al MsalRedirectComponent de los NgModule.
      this.msalService.handleRedirectObservable().subscribe({
        error: (err) => console.error('[AppComponent] Error procesando el redirect de Azure AD:', err)
      });
    }
  }
}
