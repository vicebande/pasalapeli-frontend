import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor
} from '@azure/msal-angular';
import {
  MSALInstanceFactory,
  MSALGuardConfigFactory,
  MSALInterceptorConfigFactory
} from './services/msal.config';
import { authErrorInterceptor } from './services/auth-error.interceptor';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([authErrorInterceptor])),
    // Todos los proveedores de MSAL solo se registran cuando Azure AD está habilitado.
    // En modo demo (HTTP sin HTTPS), PublicClientApplication fallaría con
    // BrowserAuthError: crypto_nonexistent porque window.crypto.subtle no está disponible.
    ...(environment.azureAd.enabled
      ? [
          {
            provide: MSAL_INSTANCE,
            useFactory: MSALInstanceFactory
          },
          {
            provide: MSAL_GUARD_CONFIG,
            useFactory: MSALGuardConfigFactory
          },
          {
            provide: MSAL_INTERCEPTOR_CONFIG,
            useFactory: MSALInterceptorConfigFactory
          },
          MsalService,
          MsalGuard,
          MsalBroadcastService,
          {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
          }
        ]
      : [])
  ]
};
