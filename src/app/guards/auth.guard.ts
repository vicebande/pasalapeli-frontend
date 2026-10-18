import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(route: import('@angular/router').ActivatedRouteSnapshot): Promise<boolean | UrlTree> {
    const user = await this.authService.waitForAuthReady();
    if (user?.authenticated) {
      return true;
    }
    const returnUrl = route.url.map(s => s.path).join('/');
    return this.router.parseUrl(returnUrl ? `/cartelera` : '/cartelera');
  }
}
