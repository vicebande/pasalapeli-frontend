export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  azureAd: {
    // Configuración de Microsoft Entra ID (Azure AD) para MSAL
    clientId: '00000000-0000-0000-0000-000000000000', // Reemplazar con el Application (client) ID de Azure
    tenantId: 'common', // Reemplazar con el Directory (tenant) ID de Azure
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200',
    scopes: ['openid', 'profile', 'email', 'api://pasalapeli-api/access_as_user'],
    enabled: false // En false permite utilizar la autenticación de demostración local
  }
};
