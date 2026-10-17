import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Manejo coherente de 401/403 en todos los servicios:
 * - 401 (sesion ausente/expirada): se deja constancia; en modo Azure el MsalInterceptor
 *   ya se encarga de renovar/redirigir al login.
 * - 403 (sin permisos): aviso claro en consola para diagnostico.
 * El error se propaga igualmente para que cada componente pueda reaccionar en su UI.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          console.warn('[Auth] 401 no autenticado o token expirado:', error.url);
        } else if (error.status === 403) {
          console.warn('[Auth] 403 sin permisos para:', error.url);
        }
      }
      return throwError(() => error);
    })
  );
};
