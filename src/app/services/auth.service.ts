import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult, InteractionStatus } from '@azure/msal-browser';
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../models/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isDemoModeSubject = new BehaviorSubject<boolean>(!environment.azureAd.enabled);
  public isDemoMode$ = this.isDemoModeSubject.asObservable();

  constructor(
    @Optional() private msalService: MsalService,
    @Optional() private msalBroadcastService: MsalBroadcastService,
    @Optional() @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private http: HttpClient
  ) {
    this.initAuth();
  }

  private initAuth(): void {
    if (environment.azureAd.enabled && this.msalService && this.msalBroadcastService) {
      // Flujo MSAL con Azure Active Directory
      this.msalBroadcastService.msalSubject$
        .pipe(
          filter((msg: EventMessage) =>
            msg.eventType === EventType.LOGIN_SUCCESS ||
            msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
          )
        )
        .subscribe((result: EventMessage) => {
          const payload = result.payload as AuthenticationResult;
          this.msalService.instance.setActiveAccount(payload.account);
          this.processMsalClaims(payload);
        });

      this.msalBroadcastService.inProgress$
        .pipe(filter((status: InteractionStatus) => status === InteractionStatus.None))
        .subscribe(() => {
          this.checkActiveAccount();
        });
    } else {
      // Modo Demo local predeterminado para pruebas directas
      this.setDemoUser('CLIENTE');
    }
  }

  private checkActiveAccount(): void {
    if (!this.msalService) return;
    const activeAccount = this.msalService.instance.getActiveAccount();
    if (activeAccount) {
      const claims = activeAccount.idTokenClaims as any;
      const roles = claims?.roles || ['ROLE_CLIENTE'];
      this.currentUserSubject.next({
        id: 2,
        email: activeAccount.username,
        name: activeAccount.name || activeAccount.username,
        roles: roles.map((r: string) => r.startsWith('ROLE_') ? r : 'ROLE_' + r.toUpperCase()),
        authenticated: true
      });
    }
  }

  private processMsalClaims(authResult: AuthenticationResult): void {
    const claims = authResult.idTokenClaims as any;
    const roles: string[] = claims?.roles || ['ROLE_CLIENTE'];

    this.currentUserSubject.next({
      id: 2,
      email: authResult.account?.username || 'usuario@duocuc.cl',
      name: authResult.account?.name || 'Estudiante Duoc UC',
      roles: roles.map(r => r.startsWith('ROLE_') ? r : 'ROLE_' + r.toUpperCase()),
      authenticated: true
    });
  }

  public login(): void {
    if (environment.azureAd.enabled && this.msalService) {
      if (this.msalGuardConfig.authRequest) {
        this.msalService.loginRedirect({ ...this.msalGuardConfig.authRequest });
      } else {
        this.msalService.loginRedirect();
      }
    } else {
      // Alternar login demo
      this.setDemoUser('CLIENTE');
    }
  }

  public logout(): void {
    if (environment.azureAd.enabled && this.msalService) {
      this.msalService.logoutRedirect({
        postLogoutRedirectUri: environment.azureAd.postLogoutRedirectUri
      });
    } else {
      this.currentUserSubject.next(null);
    }
  }

  public setDemoUser(role: 'CLIENTE' | 'ADMIN'): void {
    if (role === 'ADMIN') {
      this.currentUserSubject.next({
        id: 1,
        email: 'admin@pasalapeli.cl',
        name: 'Administrador Cine',
        roles: ['ROLE_ADMIN', 'ROLE_CLIENTE'],
        authenticated: true
      });
    } else {
      this.currentUserSubject.next({
        id: 2,
        email: 'vicente.banderas@duocuc.cl',
        name: 'Vicente Banderas',
        roles: ['ROLE_CLIENTE'],
        authenticated: true
      });
    }
  }

  public toggleDemoRole(): void {
    const current = this.currentUserSubject.value;
    if (current && current.roles.includes('ROLE_ADMIN')) {
      this.setDemoUser('CLIENTE');
    } else {
      this.setDemoUser('ADMIN');
    }
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value?.authenticated;
  }

  public isAdmin(): boolean {
    return !!this.currentUserSubject.value?.roles.includes('ROLE_ADMIN');
  }

  public getUserId(): number {
    return this.currentUserSubject.value?.id || 2;
  }

  public getUserRoleHeader(): { [header: string]: string } {
    const user = this.currentUserSubject.value;
    if (!user) return {};
    return {
      'X-Dev-User-Role': this.isAdmin() ? 'ADMIN' : 'CLIENTE',
      'X-Dev-User-Email': user.email
    };
  }
}
