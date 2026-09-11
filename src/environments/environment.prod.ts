// environment.prod.ts
// Los placeholders A_PONE_* son reemplazados en build por el Dockerfile
// usando los ARG AZURE_CLIENT_ID, AZURE_TENANT_ID y APP_BASE_URL.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  azureAd: {
    clientId: 'A_PONE_CLIENT_ID',
    tenantId: 'A_PONE_TENANT_ID',
    redirectUri: 'A_PONE_REDIRECT_URI',
    postLogoutRedirectUri: 'A_PONE_REDIRECT_URI',
    scopes: ['openid', 'profile', 'email', 'api://pasalapeli-api/access_as_user'],
    enabled: true
  }
};