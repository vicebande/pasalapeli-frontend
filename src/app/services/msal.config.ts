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
    // Toda llamada al BFF (tickets, notificaciones, admin, auth, cartelera) lleva Bearer.
    // Un prefijo unico evita olvidar rutas nuevas en el mapa.
    protectedResourceMap.set(environment.apiBaseUrl, environment.azureAd.scopes);
  }

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}
