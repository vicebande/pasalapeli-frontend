import { Routes } from '@angular/router';
import { CarteleraComponent } from './components/cartelera/cartelera.component';
import { PeliculaDetalleComponent } from './components/pelicula-detalle/pelicula-detalle.component';
import { MisTicketsComponent } from './components/mis-tickets/mis-tickets.component';
import { AdminComponent } from './components/admin/admin.component';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'cartelera', pathMatch: 'full' },
  { path: 'cartelera', component: CarteleraComponent },
  { path: 'pelicula/:id', component: PeliculaDetalleComponent },
  { path: 'mis-tickets', component: MisTicketsComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: 'cartelera' }
];
