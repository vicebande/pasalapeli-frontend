# pasalapeli-frontend (Angular SPA + EKS)

Aplicación web Single Page Application (SPA) para clientes y administradores del cine, con autenticación federada con **Microsoft Azure Active Directory (MSAL)**. Despliega sobre **EKS (Kubernetes gestionado)** como un Deployment con Service tipo `LoadBalancer`.

## 🚀 Tecnologías
- Angular 18, TypeScript 5.5
- `@azure/msal-browser` + `@azure/msal-angular`
- Nginx (serve SPA + proxy)
- Docker, Kubernetes (EKS)

## ☁️ Despliegue CI/CD (GitHub Actions → Terraform → EKS)

Este repositorio solo despliega su **carga de trabajo en EKS**. La infraestructura compartida (VPC, EKS, RDS, S3, ECR, etc.) es propietaria del repo [`pasalapeli-database`](./../pasalapeli-database) y debe desplegarse **antes** que este servicio.

Workflow `.github/workflows/deploy.yml` en cada `push` a `main`:
1. Quality Gate: SonarCloud (bloquea si falla).
2. Terraform Init: backend S3 `pasalapeli-tfstate` (`pasalapeli-frontend/terraform.tfstate`).
3. Terraform Format / Validate / Plan / Apply.
4. `aws eks update-kubeconfig --name pasalapeli-cluster --region us-east-1`
5. `kubectl apply -f k8s-manifests/` (Deployment + Service tipo LoadBalancer)

### Kubernetes manifests (`k8s-manifests/`)
- `deployment.yaml`: Deployment `pasalapeli-frontend` (1 réplica, contenedor en puerto 80).
- `service.yaml`: Service `pasalapeli-frontend-service` tipo `LoadBalancer` (puerto 80 → 80).

### GitHub Secrets requeridos
| Secret | Descripción |
|---|---|
| `AWS_ACCESS_KEY_ID` | Credencial AWS |
| `AWS_SECRET_ACCESS_KEY` | Secreto asociado |
| `AWS_SESSION_TOKEN` | Token de sesión (credenciales temporales STS) |
| `SONAR_TOKEN` | Token de SonarCloud |
| `SONAR_HOST_URL` | `https://sonarcloud.io` |

### Variables de entorno (terraform)
- `TF_VAR_environment_name` = `dev`
- `TF_VAR_domain_name` = `pasalapeli-frontend`

### Imagen ECR
El contenedor se extrae de `pasalapeli-images` (repo ECR compartido) como `frontend:latest`. Construir y pushear la imagen a ECR antes o después del despliegue EKS.

## 🔐 Integración MSAL
- `msal.config.ts`: configuración de `PublicClientApplication`, redirecciones y caché local.
- `MsalGuard`: protege rutas sensibles (compras, historial de tickets, panel admin).
- `MsalInterceptor`: inyecta el token Bearer JWT en peticiones al BFF.
