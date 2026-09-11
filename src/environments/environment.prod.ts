export const environment = {
  production: true,
  apiBaseUrl: '/api',
  azureAd: {
    clientId: '${AZURE_CLIENT_ID}',
    tenantId: '${AZURE_TENANT_ID}',
    redirectUri: 'http://localhost:80',
    postLogoutRedirectUri: 'http://localhost:80',
    scopes: ['openid', 'profile', 'email', 'api://pasalapeli-api/access_as_user'],
    enabled: true
  }
};
