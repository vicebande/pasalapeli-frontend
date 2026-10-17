import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  ProtectedResourceScopes
} from '@azure/msal-angular';
import { environment } from '../../environments/environment';

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log('[MSAL]', message);
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.azureAd.clientId,
      authority: `https://login.microsoftonline.com/${environment.azureAd.tenantId}`,
      redirectUri: environment.azureAd.redirectUri,
      postLogoutRedirectUri: environment.azureAd.postLogoutRedirectUri
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false
      }
    }
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: environment.azureAd.scopes
    }
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string | ProtectedResourceScopes> | null>();

  // En modo demo no se protege ningún endpoint: el MsalInterceptor no intercepta nada
  if (environment.azureAd.enabled) {
    // Solo los endpoints que el BFF exige autenticados (tickets, notificaciones,
    // admin y auth/me). /api/cartelera es publica: si entrara en el mapa, un
    // usuario anonimo que solo navega la cartelera seria redirigido a Microsoft
    // por el interceptor sin haber pulsado "Iniciar sesion".
    const rutasProtegidas = ['/auth/me', '/tickets', '/notificaciones', '/admin'];
    rutasProtegidas.forEach(ruta => {
      protectedResourceMap.set(`${environment.apiBaseUrl}${ruta}`, environment.azureAd.scopes);
    });
  }

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}
