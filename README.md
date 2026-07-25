# Three-Tier Microservices Project with ECS CI/CD

Project root:
`~/Desktop/MSP`

## 1) Architecture (Three-Tier + Microservices)

- Presentation tier:
  - `frontend` serves the web UI.
- Application tier:
  - `gateway` routes requests to internal services.
  - `catalog-service` manages products.
  - `order-service` creates and lists orders.
- Data tier:
  - PostgreSQL stores products and orders.

Request flow:
1. User opens `frontend` on port 3000.
2. Frontend calls `gateway` on port 8080.
3. Gateway forwards:
   - `/api/catalog/*` to `catalog-service`
   - `/api/orders/*` to `order-service`
4. Services read/write PostgreSQL.

## 2) Folder Structure

- `frontend/` UI tier
- `gateway/` API gateway
- `services/catalog-service/` product service
- `services/order-service/` order service
- `infra/ecs/task-definitions/` ECS task definitions
- `.github/workflows/ci-cd-ecs.yml` CI/CD pipeline
- `docker-compose.yml` local environment

## 3) Run Locally (Step-by-Step)

Prerequisites:
- Docker Engine + Docker Compose plugin
- Git
- AWS CLI v2

Commands:
```bash
docker compose up --build
```

Open:
- Frontend: `http://localhost:3000`
- Gateway health: `http://localhost:8080/health`
- Catalog health: `http://localhost:4001/health`
- Order health: `http://localhost:4002/health`

Stop:
```bash
docker compose down
```

## 4) AWS ECS Deployment Design

Recommended AWS resources:
1. ECR repositories (4):
   - catalog-service
   - order-service
   - gateway
   - frontend
2. ECS cluster (Fargate)
3. ECS services (4 tasks, one per component)
4. ALB:
   - internet-facing listener for frontend/gateway
5. RDS PostgreSQL instance
6. CloudWatch log groups
7. IAM roles:
   - Task execution role
   - Task role
   - GitHub OIDC deployment role

## 5) One-Time AWS Setup (Step-by-Step)

1. Create ECR repos:
```bash
cd ~/Desktop/MSP/infra/ecs/scripts
chmod +x create-ecr-repos.sh
./create-ecr-repos.sh ap-south-1
```

Optional (custom repo list):
```bash
./create-ecr-repos.sh ap-south-1 "catalog-service,order-service,gateway,frontend"
```

2. Create RDS PostgreSQL and note endpoint.
3. Create ECS cluster and 4 ECS services (catalog, order, gateway, frontend).
4. Attach each service to appropriate target groups behind ALB.
5. Update environment variables in task definitions:
   - `DB_HOST` = your RDS endpoint
   - Internal service URLs (`CATALOG_SERVICE_URL`, `ORDER_SERVICE_URL`) with Cloud Map or internal ALB DNS
   - `API_BASE_URL` for frontend
6. Create IAM role for GitHub Actions OIDC and trust your GitHub repo.

## 6) Configure GitHub Secrets

Add these repo secrets:
- `AWS_ROLE_TO_ASSUME`
- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `ECS_CLUSTER`
- `ECS_SERVICE_CATALOG`
- `ECS_SERVICE_ORDER`
- `ECS_SERVICE_GATEWAY`
- `ECS_SERVICE_FRONTEND`
- `ECR_REPOSITORY_CATALOG`
- `ECR_REPOSITORY_ORDER`
- `ECR_REPOSITORY_GATEWAY`
- `ECR_REPOSITORY_FRONTEND`
- `ECS_TASK_EXECUTION_ROLE_ARN`
- `ECS_TASK_ROLE_ARN`

## 7) CI/CD Flow (What Happens on Push)

When code is pushed to `main`:
1. GitHub Action authenticates to AWS via OIDC.
2. Builds 4 Docker images.
3. Pushes images to ECR using commit SHA tag.
4. Renders ECS task definitions with new image tags.
5. Updates each ECS service.
6. Waits until services are stable.

Pipeline file:
- `.github/workflows/ci-cd-ecs.yml`

## 8) EKS Alternative (If You Prefer Kubernetes)

If you want EKS instead of ECS:
1. Create EKS cluster.
2. Use Helm charts/Kubernetes manifests for frontend, gateway, catalog, order.
3. Use RDS for PostgreSQL.
4. Use GitHub Actions to build/push images and run `kubectl apply` or `helm upgrade --install`.

ECS is simpler for first production setup. EKS is better when you need Kubernetes portability and advanced orchestration patterns.

## 9) Next Improvements

- Move DB credentials to AWS Secrets Manager.
- Add unit/integration tests for all services.
- Add service-to-service authentication.
- Add autoscaling policies and alarms.
