# Wave 4: Deployment & DevOps Strategy
## Smart Maintenance System - Production-Ready Infrastructure

### Executive Summary

This document outlines the comprehensive deployment and DevOps strategy for the Smart Maintenance System (SMS), encompassing both the Onboarding and Maintenance portals. The strategy focuses on creating a bulletproof deployment pipeline with zero-downtime deployments, rapid iteration capabilities, and robust disaster recovery procedures.

**Key Objectives:**
- Implement fully automated CI/CD pipelines
- Achieve zero-downtime deployments
- Enable rapid feature iteration
- Ensure 99.9% uptime SLA
- Support offline-first vessel operations
- Implement comprehensive monitoring and alerting

---

## 1. CI/CD Pipeline Architecture

### 1.1 Pipeline Overview

```mermaid
graph LR
    A[Git Push] --> B[GitHub Actions]
    B --> C{Branch?}
    C -->|Feature| D[Dev Build]
    C -->|Main| E[Staging Build]
    C -->|Release| F[Prod Build]
    
    D --> G[Unit Tests]
    E --> H[Integration Tests]
    F --> I[E2E Tests]
    
    G --> J[Dev Deploy]
    H --> K[Staging Deploy]
    I --> L[Canary Deploy]
    
    L --> M{Metrics OK?}
    M -->|Yes| N[Full Deploy]
    M -->|No| O[Rollback]
```

### 1.2 GitHub Actions Workflows

#### Development Pipeline (.github/workflows/dev-pipeline.yml)
```yaml
name: Development Pipeline

on:
  push:
    branches: [feature/*, fix/*]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18.x'
  DOCKER_REGISTRY: ghcr.io

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: [onboarding-portal, maintenance-portal]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd ${{ matrix.project }}
          npm ci
      
      - name: Lint code
        run: |
          cd ${{ matrix.project }}
          npm run lint
      
      - name: Run unit tests
        run: |
          cd ${{ matrix.project }}
          npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ${{ matrix.project }}/coverage

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  build-dev-images:
    needs: [lint-and-test]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - project: onboarding-portal
            dockerfile: SMS-Onboarding-Unified/Dockerfile
          - project: maintenance-portal
            dockerfile: sms-app/Dockerfile
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/${{ matrix.project }}:dev-${{ github.sha }}
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/${{ matrix.project }}:dev-latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

#### Staging Pipeline (.github/workflows/staging-pipeline.yml)
```yaml
name: Staging Pipeline

on:
  push:
    branches: [main]

env:
  NODE_VERSION: '18.x'
  DOCKER_REGISTRY: ghcr.io
  STAGING_URL: https://staging.sms-marine.com

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: sms_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/sms_test
          REDIS_URL: redis://localhost:6379
        run: |
          npm run test:integration

  build-staging-images:
    needs: [integration-tests]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - project: onboarding-portal
            dockerfile: SMS-Onboarding-Unified/Dockerfile
          - project: maintenance-portal
            dockerfile: sms-app/Dockerfile
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/${{ matrix.project }}:staging-${{ github.sha }}
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/${{ matrix.project }}:staging-latest
          build-args: |
            NODE_ENV=staging
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: [build-staging-images]
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/staging/
          images: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/onboarding-portal:staging-${{ github.sha }}
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/maintenance-portal:staging-${{ github.sha }}
          strategy: blue-green
          route-method: service

  e2e-tests:
    needs: [deploy-staging]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run E2E tests
        uses: cypress-io/github-action@v5
        with:
          config: baseUrl=${{ env.STAGING_URL }}
          record: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

#### Production Pipeline (.github/workflows/production-pipeline.yml)
```yaml
name: Production Pipeline

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

env:
  DOCKER_REGISTRY: ghcr.io
  PRODUCTION_URL: https://sms-marine.com

jobs:
  production-checks:
    runs-on: ubuntu-latest
    outputs:
      proceed: ${{ steps.check.outputs.proceed }}
    
    steps:
      - name: Check deployment window
        id: check
        run: |
          # Check if we're in a maintenance window
          HOUR=$(date +%H)
          DAY=$(date +%u)
          
          # Allow deployments Mon-Thu 2AM-4AM UTC
          if [[ $DAY -le 4 && $HOUR -ge 2 && $HOUR -le 4 ]]; then
            echo "proceed=true" >> $GITHUB_OUTPUT
          else
            echo "proceed=manual" >> $GITHUB_OUTPUT
          fi

  build-production-images:
    needs: [production-checks]
    if: needs.production-checks.outputs.proceed != 'false'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - project: onboarding-portal
            dockerfile: SMS-Onboarding-Unified/Dockerfile
          - project: maintenance-portal
            dockerfile: sms-app/Dockerfile
    
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.inputs.version || github.ref }}
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.DOCKER_REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract version
        id: version
        run: echo "version=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/${{ matrix.project }}:${{ steps.version.outputs.version }}
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/${{ matrix.project }}:production-latest
          build-args: |
            NODE_ENV=production
            VERSION=${{ steps.version.outputs.version }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  canary-deployment:
    needs: [build-production-images]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy canary (5%)
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/production/canary/
          images: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/onboarding-portal:${{ steps.version.outputs.version }}
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/maintenance-portal:${{ steps.version.outputs.version }}
          strategy: canary
          percentage: 5
      
      - name: Monitor canary metrics
        run: |
          # Monitor for 15 minutes
          ./scripts/monitor-canary.sh --duration 900 --threshold 99.5

  full-deployment:
    needs: [canary-deployment]
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Full production deployment
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            k8s/production/
          images: |
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/onboarding-portal:${{ steps.version.outputs.version }}
            ${{ env.DOCKER_REGISTRY }}/${{ github.repository }}/maintenance-portal:${{ steps.version.outputs.version }}
          strategy: blue-green
          route-method: service
      
      - name: Verify deployment
        run: |
          ./scripts/verify-deployment.sh --url ${{ env.PRODUCTION_URL }}
      
      - name: Update deployment status
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: context.payload.deployment.id,
              state: 'success',
              environment_url: '${{ env.PRODUCTION_URL }}'
            });
```

---

## 2. Blue-Green Deployment Strategy

### 2.1 Architecture Overview

```yaml
# k8s/production/blue-green-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: sms-portal-active
  labels:
    app: sms-portal
spec:
  selector:
    app: sms-portal
    version: blue  # Switch between blue/green
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer

---
apiVersion: v1
kind: Service
metadata:
  name: sms-portal-preview
  labels:
    app: sms-portal
spec:
  selector:
    app: sms-portal
    version: green  # Opposite of active
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### 2.2 Deployment Script

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

set -e

NAMESPACE=${NAMESPACE:-production}
APP_NAME=${APP_NAME:-sms-portal}
NEW_VERSION=$1

# Determine current active version
CURRENT_VERSION=$(kubectl get service ${APP_NAME}-active -n $NAMESPACE -o jsonpath='{.spec.selector.version}')
NEW_COLOR=$([ "$CURRENT_VERSION" == "blue" ] && echo "green" || echo "blue")

echo "Current active version: $CURRENT_VERSION"
echo "Deploying new version to: $NEW_COLOR"

# Deploy to inactive slot
kubectl set image deployment/${APP_NAME}-${NEW_COLOR} \
  ${APP_NAME}=${DOCKER_REGISTRY}/${APP_NAME}:${NEW_VERSION} \
  -n $NAMESPACE

# Wait for rollout
kubectl rollout status deployment/${APP_NAME}-${NEW_COLOR} -n $NAMESPACE

# Run smoke tests
echo "Running smoke tests on preview environment..."
./scripts/smoke-tests.sh --target ${APP_NAME}-preview

# Switch traffic
echo "Switching traffic to new version..."
kubectl patch service ${APP_NAME}-active -n $NAMESPACE \
  -p '{"spec":{"selector":{"version":"'${NEW_COLOR}'"}}}'

# Update preview to point to old version
kubectl patch service ${APP_NAME}-preview -n $NAMESPACE \
  -p '{"spec":{"selector":{"version":"'${CURRENT_VERSION}'"}}}'

echo "Deployment complete. New version is live."
```

### 2.3 Rollback Procedure

```bash
#!/bin/bash
# scripts/rollback.sh

set -e

NAMESPACE=${NAMESPACE:-production}
APP_NAME=${APP_NAME:-sms-portal}

# Get current versions
ACTIVE_VERSION=$(kubectl get service ${APP_NAME}-active -n $NAMESPACE -o jsonpath='{.spec.selector.version}')
PREVIEW_VERSION=$(kubectl get service ${APP_NAME}-preview -n $NAMESPACE -o jsonpath='{.spec.selector.version}')

echo "Rolling back from $ACTIVE_VERSION to $PREVIEW_VERSION"

# Quick switch
kubectl patch service ${APP_NAME}-active -n $NAMESPACE \
  -p '{"spec":{"selector":{"version":"'${PREVIEW_VERSION}'"}}}'

kubectl patch service ${APP_NAME}-preview -n $NAMESPACE \
  -p '{"spec":{"selector":{"version":"'${ACTIVE_VERSION}'"}}}'

# Verify rollback
./scripts/verify-deployment.sh --quick

echo "Rollback complete."

# Send alerts
./scripts/send-alert.sh --severity high --message "Production rollback executed"
```

---

## 3. Environment Management

### 3.1 Environment Configuration

```yaml
# environments/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - secrets.yaml

configMapGenerator:
  - name: app-config
    files:
      - config.json

secretGenerator:
  - name: app-secrets
    envs:
      - secrets.env

images:
  - name: sms-portal
    newTag: latest
```

```yaml
# environments/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../base

patchesStrategicMerge:
  - deployment-patch.yaml
  - service-patch.yaml

configMapGenerator:
  - name: app-config
    behavior: merge
    literals:
      - NODE_ENV=production
      - API_URL=https://api.sms-marine.com
      - ENABLE_ANALYTICS=true

replicas:
  - name: sms-portal
    count: 3

resources:
  - hpa.yaml
  - pdb.yaml
```

### 3.2 Secrets Management

```yaml
# k8s/sealed-secrets/database-secret.yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: database-credentials
  namespace: production
spec:
  encryptedData:
    DATABASE_URL: AgBv2K1M8Y3... # Encrypted value
    REDIS_PASSWORD: AgCX9K2N7Z4... # Encrypted value
```

```bash
#!/bin/bash
# scripts/seal-secret.sh

SECRET_NAME=$1
NAMESPACE=$2
SECRET_FILE=$3

# Create secret locally
kubectl create secret generic $SECRET_NAME \
  --from-env-file=$SECRET_FILE \
  --dry-run=client -o yaml > temp-secret.yaml

# Seal the secret
kubeseal --format=yaml < temp-secret.yaml > sealed-$SECRET_NAME.yaml

# Clean up
rm temp-secret.yaml

echo "Sealed secret created: sealed-$SECRET_NAME.yaml"
```

---

## 4. GitOps Workflow

### 4.1 ArgoCD Configuration

```yaml
# argocd/applications/sms-production.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: sms-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/sms-marine/infrastructure
    targetRevision: main
    path: k8s/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### 4.2 GitOps Directory Structure

```
infrastructure/
├── k8s/
│   ├── base/
│   │   ├── kustomization.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── production/
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── hpa.yaml
│   │   ├── pdb.yaml
│   │   └── monitoring/
│   ├── staging/
│   └── development/
├── terraform/
│   ├── modules/
│   ├── environments/
│   └── backend.tf
└── scripts/
    ├── deploy.sh
    ├── rollback.sh
    └── verify.sh
```

---

## 5. Infrastructure Automation

### 5.1 Terraform Configuration

```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "sms-terraform-state"
    storage_account_name = "smsterraformstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}

module "aks_cluster" {
  source = "./modules/aks"
  
  cluster_name        = "sms-production"
  location            = var.location
  resource_group_name = var.resource_group_name
  
  node_pools = {
    system = {
      vm_size    = "Standard_D4s_v3"
      node_count = 3
      max_pods   = 110
    }
    application = {
      vm_size    = "Standard_D8s_v3"
      node_count = 5
      max_pods   = 60
      
      node_taints = [
        {
          key    = "workload"
          value  = "application"
          effect = "NoSchedule"
        }
      ]
    }
  }
  
  network_profile = {
    network_plugin     = "azure"
    network_policy     = "calico"
    load_balancer_sku  = "standard"
    outbound_type      = "loadBalancer"
  }
}

module "postgresql" {
  source = "./modules/postgresql"
  
  server_name         = "sms-production-db"
  location            = var.location
  resource_group_name = var.resource_group_name
  
  sku_name   = "GP_Gen5_4"
  storage_mb = 102400
  
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true
  
  firewall_rules = {
    aks = {
      start_ip = module.aks_cluster.outbound_ip
      end_ip   = module.aks_cluster.outbound_ip
    }
  }
}

module "redis" {
  source = "./modules/redis"
  
  cache_name          = "sms-production-cache"
  location            = var.location
  resource_group_name = var.resource_group_name
  
  capacity = 2
  family   = "P"
  sku_name = "Premium"
  
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  
  redis_configuration = {
    maxmemory_policy = "allkeys-lru"
    enable_authentication = true
  }
}
```

### 5.2 Ansible Playbooks

```yaml
# ansible/playbooks/setup-monitoring.yml
---
- name: Setup Monitoring Stack
  hosts: kubernetes_masters
  vars:
    prometheus_version: "2.45.0"
    grafana_version: "10.0.0"
    alertmanager_version: "0.26.0"
  
  tasks:
    - name: Add Prometheus Helm repository
      kubernetes.core.helm_repository:
        name: prometheus-community
        repo_url: https://prometheus-community.github.io/helm-charts
    
    - name: Deploy Prometheus Stack
      kubernetes.core.helm:
        name: prometheus
        chart_ref: prometheus-community/kube-prometheus-stack
        release_namespace: monitoring
        create_namespace: true
        values:
          prometheus:
            prometheusSpec:
              retention: 30d
              storageSpec:
                volumeClaimTemplate:
                  spec:
                    storageClassName: managed-premium
                    resources:
                      requests:
                        storage: 100Gi
          grafana:
            adminPassword: "{{ vault_grafana_admin_password }}"
            persistence:
              enabled: true
              storageClassName: managed-premium
              size: 10Gi
```

---

## 6. Container Orchestration

### 6.1 Kubernetes Manifests

```yaml
# k8s/production/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sms-portal
  labels:
    app: sms-portal
    version: blue
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: sms-portal
      version: blue
  template:
    metadata:
      labels:
        app: sms-portal
        version: blue
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values: [sms-portal]
              topologyKey: kubernetes.io/hostname
      containers:
        - name: sms-portal
          image: ghcr.io/sms-marine/sms-portal:latest
          ports:
            - containerPort: 3000
              name: http
            - containerPort: 9090
              name: metrics
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "3000"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-credentials
                  key: DATABASE_URL
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: REDIS_URL
          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 4Gi
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
          volumeMounts:
            - name: app-config
              mountPath: /app/config
            - name: temp
              mountPath: /tmp
      volumes:
        - name: app-config
          configMap:
            name: app-config
        - name: temp
          emptyDir: {}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
```

### 6.2 Horizontal Pod Autoscaling

```yaml
# k8s/production/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sms-portal-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sms-portal
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 1000
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
        - type: Pods
          value: 4
          periodSeconds: 60
```

---

## 7. Monitoring Integration

### 7.1 Prometheus Configuration

```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - /etc/prometheus/rules/*.yml
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets: ['alertmanager:9093']
    
    scrape_configs:
      - job_name: 'sms-portal'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
```

### 7.2 Grafana Dashboards

```json
{
  "dashboard": {
    "title": "SMS Portal Performance",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, status)"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
          }
        ]
      },
      {
        "title": "Active Vessels",
        "targets": [
          {
            "expr": "sms_active_vessels_total"
          }
        ]
      }
    ]
  }
}
```

### 7.3 Alerting Rules

```yaml
# monitoring/alerts.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-alerts
data:
  sms-alerts.yml: |
    groups:
      - name: sms-portal
        interval: 30s
        rules:
          - alert: HighErrorRate
            expr: |
              sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
              / sum(rate(http_requests_total[5m])) by (job) > 0.05
            for: 5m
            labels:
              severity: critical
              team: platform
            annotations:
              summary: High error rate on {{ $labels.job }}
              description: Error rate is {{ $value | humanizePercentage }} for {{ $labels.job }}
          
          - alert: HighResponseTime
            expr: |
              histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
            for: 10m
            labels:
              severity: warning
              team: platform
            annotations:
              summary: High response time
              description: 95th percentile response time is {{ $value }}s
          
          - alert: PodCrashLooping
            expr: |
              rate(kube_pod_container_status_restarts_total[15m]) > 0
            for: 5m
            labels:
              severity: critical
              team: platform
            annotations:
              summary: Pod {{ $labels.pod }} is crash looping
              description: Pod {{ $labels.pod }} has restarted {{ $value }} times in the last 15 minutes
          
          - alert: HighMemoryUsage
            expr: |
              container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
            for: 5m
            labels:
              severity: warning
              team: platform
            annotations:
              summary: High memory usage for {{ $labels.pod }}
              description: Memory usage is {{ $value | humanizePercentage }} of limit
```

---

## 8. Log Aggregation

### 8.1 Fluentd Configuration

```yaml
# logging/fluentd-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>
    
    <filter kubernetes.**>
      @type kubernetes_metadata
      @id filter_kube_metadata
      kubernetes_url "#{ENV['KUBERNETES_URL']}"
      verify_ssl "#{ENV['KUBERNETES_VERIFY_SSL']}"
    </filter>
    
    <filter kubernetes.var.log.containers.sms-**.log>
      @type parser
      key_name log
      <parse>
        @type json
      </parse>
    </filter>
    
    <match kubernetes.var.log.containers.sms-**.log>
      @type elasticsearch
      @id out_es
      @log_level info
      include_tag_key true
      host "#{ENV['ELASTICSEARCH_HOST']}"
      port "#{ENV['ELASTICSEARCH_PORT']}"
      scheme "#{ENV['ELASTICSEARCH_SCHEME']}"
      ssl_verify "#{ENV['ELASTICSEARCH_SSL_VERIFY']}"
      user "#{ENV['ELASTICSEARCH_USER']}"
      password "#{ENV['ELASTICSEARCH_PASSWORD']}"
      logstash_format true
      logstash_prefix sms-logs
      <buffer>
        @type memory
        flush_interval 10s
        chunk_limit_size 10M
        queue_limit_length 256
        retry_max_interval 30
        retry_forever false
        overflow_action drop_oldest_chunk
      </buffer>
    </match>
```

### 8.2 Log Processing Pipeline

```python
# scripts/log-processor.py
#!/usr/bin/env python3

import json
import re
from datetime import datetime
from elasticsearch import Elasticsearch

class LogProcessor:
    def __init__(self, es_host, es_port):
        self.es = Elasticsearch([f"{es_host}:{es_port}"])
        self.patterns = {
            'error': re.compile(r'(ERROR|FATAL|CRITICAL)', re.I),
            'sql_query': re.compile(r'SELECT|INSERT|UPDATE|DELETE', re.I),
            'api_request': re.compile(r'(GET|POST|PUT|DELETE)\s+/[\w/]+'),
            'performance': re.compile(r'took\s+(\d+)ms'),
        }
    
    def process_log(self, log_entry):
        """Process and enrich log entry"""
        enriched = {
            'timestamp': datetime.utcnow().isoformat(),
            'original': log_entry,
            'level': self._detect_level(log_entry),
            'category': self._categorize(log_entry),
            'metrics': self._extract_metrics(log_entry)
        }
        
        # Extract structured data
        try:
            parsed = json.loads(log_entry)
            enriched.update(parsed)
        except:
            enriched['message'] = log_entry
        
        return enriched
    
    def _detect_level(self, log):
        if self.patterns['error'].search(log):
            return 'error'
        elif 'WARN' in log.upper():
            return 'warning'
        elif 'DEBUG' in log.upper():
            return 'debug'
        return 'info'
    
    def _categorize(self, log):
        if self.patterns['sql_query'].search(log):
            return 'database'
        elif self.patterns['api_request'].search(log):
            return 'api'
        elif 'auth' in log.lower():
            return 'authentication'
        return 'application'
    
    def _extract_metrics(self, log):
        metrics = {}
        
        # Extract response time
        perf_match = self.patterns['performance'].search(log)
        if perf_match:
            metrics['response_time_ms'] = int(perf_match.group(1))
        
        return metrics
    
    def index_log(self, log_entry):
        """Index processed log to Elasticsearch"""
        processed = self.process_log(log_entry)
        self.es.index(
            index=f"sms-logs-{datetime.utcnow().strftime('%Y.%m.%d')}",
            body=processed
        )
```

---

## 9. Backup Automation

### 9.1 Database Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

# Configuration
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
S3_BUCKET="sms-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Perform backup
echo "Starting database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump \
  -h $DB_HOST \
  -U $DB_USER \
  -d $DB_NAME \
  --format=custom \
  --verbose \
  --file=$BACKUP_DIR/sms_${TIMESTAMP}.dump

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_DIR/sms_${TIMESTAMP}.dump

# Calculate checksum
CHECKSUM=$(sha256sum $BACKUP_DIR/sms_${TIMESTAMP}.dump.gz | awk '{print $1}')
echo $CHECKSUM > $BACKUP_DIR/sms_${TIMESTAMP}.dump.gz.sha256

# Upload to S3
echo "Uploading to S3..."
aws s3 cp $BACKUP_DIR/sms_${TIMESTAMP}.dump.gz s3://$S3_BUCKET/postgres/
aws s3 cp $BACKUP_DIR/sms_${TIMESTAMP}.dump.gz.sha256 s3://$S3_BUCKET/postgres/

# Verify upload
aws s3api head-object --bucket $S3_BUCKET --key postgres/sms_${TIMESTAMP}.dump.gz

# Clean up old local backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +7 -delete

# Clean up old S3 backups
aws s3 ls s3://$S3_BUCKET/postgres/ | \
  while read -r line; do
    createDate=$(echo $line | awk '{print $1" "$2}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "$RETENTION_DAYS days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo $line | awk '{print $4}')
      aws s3 rm s3://$S3_BUCKET/postgres/$fileName
    fi
  done

echo "Backup completed successfully"
```

### 9.2 Application State Backup

```yaml
# k8s/cronjobs/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup-job
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: ghcr.io/sms-marine/backup-tool:latest
              env:
                - name: BACKUP_TYPE
                  value: "full"
                - name: S3_BUCKET
                  valueFrom:
                    configMapKeyRef:
                      name: backup-config
                      key: s3_bucket
                - name: AWS_ACCESS_KEY_ID
                  valueFrom:
                    secretKeyRef:
                      name: aws-credentials
                      key: access_key_id
                - name: AWS_SECRET_ACCESS_KEY
                  valueFrom:
                    secretKeyRef:
                      name: aws-credentials
                      key: secret_access_key
              volumeMounts:
                - name: data
                  mountPath: /data
                  readOnly: true
          volumes:
            - name: data
              persistentVolumeClaim:
                claimName: app-data
```

---

## 10. Disaster Recovery

### 10.1 DR Architecture

```mermaid
graph TB
    subgraph Primary Region
        A[Production Cluster]
        B[Primary Database]
        C[Primary Storage]
    end
    
    subgraph DR Region
        D[DR Cluster - Standby]
        E[Replica Database]
        F[Replicated Storage]
    end
    
    B -->|Streaming Replication| E
    C -->|Cross-Region Replication| F
    A -->|Health Checks| G{DR Controller}
    G -->|Failover| D
```

### 10.2 Failover Procedures

```bash
#!/bin/bash
# scripts/dr-failover.sh

set -e

# Configuration
DR_REGION="westus2"
PRIMARY_REGION="eastus"
NAMESPACE="production"

echo "=== SMS Disaster Recovery Failover ==="
echo "Primary Region: $PRIMARY_REGION"
echo "DR Region: $DR_REGION"
echo ""

# Pre-flight checks
echo "Running pre-flight checks..."
./scripts/dr-preflight-check.sh

# Confirm failover
read -p "Are you sure you want to failover to DR region? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Failover cancelled"
    exit 0
fi

# Step 1: Update DNS
echo "Updating DNS records..."
./scripts/update-dns.sh --target $DR_REGION

# Step 2: Promote DR database
echo "Promoting DR database to primary..."
az postgres server replica promote \
  --name sms-db-dr \
  --resource-group sms-$DR_REGION

# Step 3: Scale up DR cluster
echo "Scaling up DR cluster..."
kubectl config use-context $DR_REGION
kubectl scale deployment --all --replicas=3 -n $NAMESPACE

# Step 4: Update application configuration
echo "Updating application configuration..."
kubectl set env deployment/sms-portal \
  DATABASE_HOST=sms-db-dr.postgres.database.azure.com \
  -n $NAMESPACE

# Step 5: Verify services
echo "Verifying services..."
./scripts/verify-dr-services.sh

# Step 6: Update monitoring
echo "Updating monitoring targets..."
./scripts/update-monitoring.sh --region $DR_REGION

echo ""
echo "Failover completed successfully!"
echo "Services are now running in: $DR_REGION"
```

### 10.3 Recovery Time Objectives

| Component | RTO | RPO | Strategy |
|-----------|-----|-----|----------|
| Database | 15 min | 5 min | Streaming replication |
| Application | 5 min | 0 min | Multi-region deployment |
| File Storage | 30 min | 1 hour | Cross-region replication |
| Configuration | 5 min | 0 min | GitOps sync |

---

## 11. Operations Runbook

### 11.1 Standard Operating Procedures

#### 11.1.1 Deployment Checklist

```markdown
## Pre-Deployment
- [ ] Review and approve changes in PR
- [ ] Run security scan on new images
- [ ] Verify staging deployment successful
- [ ] Check deployment window compliance
- [ ] Notify stakeholders of deployment

## Deployment
- [ ] Create deployment tag
- [ ] Monitor canary metrics (15 min)
- [ ] Verify health checks passing
- [ ] Check error rates < 0.1%
- [ ] Confirm resource utilization normal

## Post-Deployment
- [ ] Update deployment log
- [ ] Monitor for 30 minutes
- [ ] Send deployment summary
- [ ] Update documentation if needed
- [ ] Close deployment ticket
```

#### 11.1.2 Incident Response

```bash
#!/bin/bash
# scripts/incident-response.sh

SEVERITY=$1
COMPONENT=$2
DESCRIPTION=$3

# Create incident
INCIDENT_ID=$(date +%Y%m%d%H%M%S)

# Log incident
echo "[$INCIDENT_ID] Severity: $SEVERITY, Component: $COMPONENT" >> /var/log/incidents.log
echo "[$INCIDENT_ID] Description: $DESCRIPTION" >> /var/log/incidents.log

# Execute response based on severity
case $SEVERITY in
  "critical")
    # Page on-call engineer
    ./scripts/page-oncall.sh --message "Critical incident: $DESCRIPTION"
    
    # Create war room
    ./scripts/create-warroom.sh --id $INCIDENT_ID
    
    # Enable detailed logging
    kubectl set env deployment --all LOG_LEVEL=debug -n production
    ;;
    
  "high")
    # Notify team
    ./scripts/notify-team.sh --channel alerts --message "High severity incident: $DESCRIPTION"
    
    # Increase monitoring frequency
    ./scripts/adjust-monitoring.sh --interval 30s
    ;;
    
  "medium")
    # Create ticket
    ./scripts/create-ticket.sh --priority medium --description "$DESCRIPTION"
    ;;
esac

# Collect diagnostics
./scripts/collect-diagnostics.sh --incident $INCIDENT_ID --component $COMPONENT
```

### 11.2 Monitoring Dashboards

```yaml
# monitoring/dashboards/operations.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: operations-dashboard
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "SMS Operations Dashboard",
        "panels": [
          {
            "title": "System Health",
            "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
            "targets": [{
              "expr": "up{job=~\"sms-.*\"}"
            }]
          },
          {
            "title": "Deployment Status",
            "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
            "targets": [{
              "expr": "kube_deployment_status_replicas_available / kube_deployment_spec_replicas"
            }]
          },
          {
            "title": "Error Budget",
            "gridPos": {"h": 8, "w": 8, "x": 0, "y": 8},
            "targets": [{
              "expr": "(1 - (sum(rate(http_requests_total{status=~\"5..\"}[28d])) / sum(rate(http_requests_total[28d])))) * 100"
            }]
          }
        ]
      }
    }
```

### 11.3 Maintenance Procedures

```bash
#!/bin/bash
# scripts/maintenance-mode.sh

ACTION=$1  # enable/disable

if [ "$ACTION" == "enable" ]; then
    echo "Enabling maintenance mode..."
    
    # Deploy maintenance page
    kubectl apply -f k8s/maintenance/maintenance-page.yaml
    
    # Route traffic to maintenance page
    kubectl patch ingress sms-ingress --type=json \
      -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "maintenance-page"}]'
    
    # Scale down applications (keep minimum for health checks)
    kubectl scale deployment sms-portal --replicas=1 -n production
    
    echo "Maintenance mode enabled"
    
elif [ "$ACTION" == "disable" ]; then
    echo "Disabling maintenance mode..."
    
    # Scale up applications
    kubectl scale deployment sms-portal --replicas=3 -n production
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=sms-portal --timeout=300s
    
    # Route traffic back to application
    kubectl patch ingress sms-ingress --type=json \
      -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value": "sms-portal"}]'
    
    # Remove maintenance page
    kubectl delete -f k8s/maintenance/maintenance-page.yaml
    
    echo "Maintenance mode disabled"
fi
```

---

## 12. Security Hardening

### 12.1 Network Policies

```yaml
# k8s/security/network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sms-portal-netpol
spec:
  podSelector:
    matchLabels:
      app: sms-portal
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
        - podSelector:
            matchLabels:
              app: prometheus
      ports:
        - protocol: TCP
          port: 3000
        - protocol: TCP
          port: 9090
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: database
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector:
            matchLabels:
              name: cache
      ports:
        - protocol: TCP
          port: 6379
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

### 12.2 Pod Security Policies

```yaml
# k8s/security/pod-security-policy.yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: sms-restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  supplementalGroups:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
  readOnlyRootFilesystem: true
```

---

## 13. Performance Optimization

### 13.1 CDN Configuration

```hcl
# terraform/modules/cdn/main.tf
resource "azurerm_cdn_profile" "sms" {
  name                = "sms-cdn-profile"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard_Microsoft"
}

resource "azurerm_cdn_endpoint" "sms" {
  name                = "sms-cdn-endpoint"
  profile_name        = azurerm_cdn_profile.sms.name
  location            = var.location
  resource_group_name = var.resource_group_name
  
  origin {
    name      = "sms-origin"
    host_name = var.origin_host_name
  }
  
  delivery_rule {
    name  = "cacheControl"
    order = 1
    
    url_path_condition {
      operator     = "BeginsWith"
      match_values = ["/static/"]
    }
    
    cache_expiration_action {
      behavior = "Override"
      duration = "7.00:00:00"
    }
  }
  
  delivery_rule {
    name  = "compression"
    order = 2
    
    request_header_condition {
      operator     = "Equal"
      header_name  = "Accept-Encoding"
      match_values = ["gzip"]
    }
    
    url_file_extension_condition {
      operator     = "Equal"
      match_values = ["js", "css", "json"]
    }
    
    cache_expiration_action {
      behavior = "SetIfMissing"
      duration = "1.00:00:00"
    }
  }
}
```

### 13.2 Database Optimization

```sql
-- scripts/db-optimization.sql

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_equipment_vessel_status 
ON equipment(vessel_id, status) 
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_faults_vessel_created 
ON faults(vessel_id, created_at DESC) 
WHERE resolved_at IS NULL;

CREATE INDEX CONCURRENTLY idx_maintenance_logs_equipment_date 
ON maintenance_logs(equipment_id, log_date DESC);

-- Partitioning for large tables
CREATE TABLE maintenance_logs_2024 PARTITION OF maintenance_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE maintenance_logs_2025 PARTITION OF maintenance_logs
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Materialized view for dashboard queries
CREATE MATERIALIZED VIEW vessel_statistics AS
SELECT 
    v.id as vessel_id,
    v.name as vessel_name,
    COUNT(DISTINCT e.id) as equipment_count,
    COUNT(DISTINCT f.id) FILTER (WHERE f.resolved_at IS NULL) as open_faults,
    COUNT(DISTINCT f.id) FILTER (WHERE f.severity = 'critical' AND f.resolved_at IS NULL) as critical_faults,
    AVG(EXTRACT(EPOCH FROM (f.resolved_at - f.created_at))/3600)::numeric(10,2) as avg_resolution_hours
FROM vessels v
LEFT JOIN equipment e ON e.vessel_id = v.id
LEFT JOIN faults f ON f.vessel_id = v.id
WHERE v.deleted_at IS NULL
GROUP BY v.id, v.name;

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_vessel_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY vessel_statistics;
END;
$$ LANGUAGE plpgsql;
```

---

## 14. Cost Optimization

### 14.1 Resource Rightsizing

```python
#!/usr/bin/env python3
# scripts/resource-optimizer.py

import kubernetes
from kubernetes import client, config
import statistics

def analyze_resource_usage(namespace="production"):
    """Analyze resource usage and recommend optimizations"""
    
    config.load_incluster_config()
    v1 = client.CoreV1Api()
    
    # Get metrics for all pods
    metrics = {}
    
    pods = v1.list_namespaced_pod(namespace)
    for pod in pods.items:
        pod_name = pod.metadata.name
        
        # Get resource requests and limits
        for container in pod.spec.containers:
            key = f"{pod_name}/{container.name}"
            
            metrics[key] = {
                'cpu_request': container.resources.requests.get('cpu', '0'),
                'cpu_limit': container.resources.limits.get('cpu', '0'),
                'memory_request': container.resources.requests.get('memory', '0'),
                'memory_limit': container.resources.limits.get('memory', '0'),
                'actual_cpu': [],  # Will be populated from metrics server
                'actual_memory': []
            }
    
    # Analyze and recommend
    recommendations = []
    
    for key, data in metrics.items():
        if data['actual_cpu']:
            avg_cpu = statistics.mean(data['actual_cpu'])
            cpu_request = parse_cpu(data['cpu_request'])
            
            if avg_cpu < cpu_request * 0.5:
                recommendations.append({
                    'resource': key,
                    'type': 'cpu',
                    'current': data['cpu_request'],
                    'recommended': f"{int(avg_cpu * 1.2)}m",
                    'savings': f"{int((cpu_request - avg_cpu * 1.2) / cpu_request * 100)}%"
                })
    
    return recommendations

def generate_cost_report():
    """Generate cost optimization report"""
    
    recommendations = analyze_resource_usage()
    
    print("=== SMS Cost Optimization Report ===")
    print(f"Total recommendations: {len(recommendations)}")
    print("\nTop savings opportunities:")
    
    for rec in sorted(recommendations, key=lambda x: x['savings'], reverse=True)[:10]:
        print(f"\n{rec['resource']}:")
        print(f"  Resource: {rec['type']}")
        print(f"  Current: {rec['current']}")
        print(f"  Recommended: {rec['recommended']}")
        print(f"  Estimated savings: {rec['savings']}")

if __name__ == "__main__":
    generate_cost_report()
```

### 14.2 Spot Instance Configuration

```yaml
# k8s/production/spot-nodepool.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: spot-instance-config
data:
  config.yaml: |
    nodeGroups:
      - name: spot-workers
        minSize: 2
        maxSize: 10
        desiredCapacity: 5
        instanceTypes:
          - d4s_v3
          - d8s_v3
          - e4s_v3
        spot: true
        spotAllocationStrategy: capacity-optimized
        labels:
          workload-type: batch
          node-lifecycle: spot
        taints:
          - key: spot
            value: "true"
            effect: NoSchedule
        tags:
          Environment: production
          ManagedBy: cluster-autoscaler
```

---

## Summary

This comprehensive deployment and DevOps strategy provides:

1. **Automated CI/CD**: Complete GitHub Actions pipelines for dev, staging, and production
2. **Zero-downtime deployments**: Blue-green strategy with canary rollouts
3. **Infrastructure as Code**: Terraform and Kubernetes manifests for reproducible infrastructure
4. **Comprehensive monitoring**: Prometheus, Grafana, and custom alerting
5. **Disaster recovery**: Multi-region setup with automated failover
6. **Security hardening**: Network policies, pod security, and secrets management
7. **Cost optimization**: Resource rightsizing and spot instance usage
8. **Operational excellence**: Detailed runbooks and automation scripts

The strategy ensures the SMS platform can handle rapid iteration while maintaining high availability and reliability for vessel operations worldwide.