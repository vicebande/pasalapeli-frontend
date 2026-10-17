import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const user = await this.authService.waitForAuthReady();
    if (user?.roles.includes('ROLE_ADMIN')) {
      return true;
    }
    alert('Acceso restringido: Se requiere rol de Administrador.');
    return this.router.parseUrl('/cartelera');
  }
}
