# TravelVerse — DevOps CI/CD Project Notes

**Author:** Sourav Das Hriday
**Date:** July 2026
**Tech Stack:** Jenkins | Docker | SonarQube | Trivy | AWS EKS | ArgoCD | Prometheus | Grafana | Terraform
**GitHub:** https://github.com/SouravDasHriday/travelverse-mega-project

---

## Project Overview

TravelVerse is a full-stack travel blogging application (React frontend + Node.js backend + MongoDB database) deployed using a complete, production-grade DevOps CI/CD pipeline on AWS.

### Architecture Flow

```
Developer pushes code to GitHub
        ↓
Jenkins (CI) pulls, scans, builds, pushes
        ↓
DockerHub stores versioned images
        ↓
ArgoCD (CD) watches GitHub, deploys to EKS
        ↓
TravelVerse runs on AWS EKS (Kubernetes)
        ↓
Prometheus + Grafana monitor the cluster
```

---

## Phase 1 — Infrastructure Provisioning with Terraform

### What is Terraform?
Terraform is an **Infrastructure as Code (IaC)** tool. Instead of manually clicking through the AWS console, we write `.tf` files that describe our desired infrastructure. Terraform reads these files and provisions everything automatically. This is repeatable, version-controlled, and destroys cleanly.

### Key Commands
```bash
terraform init                  # Download providers (AWS plugin)
terraform plan                  # Preview what will be created
terraform apply -auto-approve   # Create infrastructure
terraform destroy -auto-approve # Delete everything
```

### What We Provisioned
- **2 EC2 instances** (`t2.large`, Ubuntu 22.04) in `ap-southeast-1` (Singapore)
  - `Jenkins-Master-Node` — runs Jenkins + SonarQube
  - `Jenkins-Worker-Node` — runs Docker builds + Trivy
- **1 Security Group** — opening ports 22 (SSH), 8080 (Jenkins), 9000 (SonarQube)
- **1 Key Pair** — `terra-key` for SSH access

### Terraform File Structure
| File | Purpose |
|---|---|
| `main.tf` | Defines EC2 instances, security groups, key pair |
| `variables.tf` | Parameterizes AMI ID, instance type, region |
| `outputs.tf` | Prints public IPs after apply |
| `terraform.tfvars` | Holds actual variable values |

> **Key DevOps Learning:** With IaC, you can rebuild your entire infrastructure in minutes. When we made mistakes in this project, we ran `terraform destroy` and `terraform apply` to start fresh — no manual cleanup needed!

---

## Phase 2 — Application Source Code

**Repository:** https://github.com/SouravDasHriday/travelverse-mega-project

### Application Stack
| Component | Technology | Port |
|---|---|---|
| Frontend | React + Vite | 80 (Nginx in production) |
| Backend | Node.js + Express | 5000 |
| Database | MongoDB | 27017 |

### Key DevOps Files in the Repository
```
TravelVerse-Mega-Project/
├── Jenkinsfile          <- CI/CD pipeline definition
├── frontend/
│   ├── Dockerfile       <- Multi-stage Nginx production build
│   ├── nginx.conf       <- Routes /api calls to backend service
│   └── vite.config.js
├── backend/
│   └── Dockerfile
├── k8s/
│   ├── frontend.yaml    <- K8s Deployment + LoadBalancer Service
│   ├── backend.yaml     <- K8s Deployment + ClusterIP Service
│   └── mongo.yaml       <- K8s Deployment + ClusterIP Service
└── terraform/
```

---

## Phase 3 — Automated Server Setup Scripts

### Why Shell Scripts?
Instead of manually installing 10+ tools on each server, we wrote shell scripts to automate everything. This is **configuration management** — a core DevOps skill.

### Master Node Setup Script (`scripts/master-setup.sh`)
The Master Node is the **brain**. It runs Jenkins and SonarQube.

```bash
#!/bin/bash
# Master Node Setup Script

echo "Updating system..."
sudo apt update -y

echo "Installing Docker..."
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu

echo "Installing Jenkins..."
sudo apt install fontconfig openjdk-21-jre -y
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update -y
sudo apt install jenkins -y

echo "Installing AWS CLI, kubectl, eksctl, ArgoCD CLI, Helm..."
# (Tools for managing EKS from this server)

echo "Deploying SonarQube Container..."
sudo systemctl enable docker && sudo systemctl start docker
sudo docker run -itd --name SonarQube-Server -p 9000:9000 sonarqube:lts-community

echo "Master Setup Complete!"
```

### Worker Node Setup Script (`scripts/worker-setup.sh`)
The Worker Node is the **muscle**. Jenkins connects via SSH and runs all heavy build tasks here.

```bash
#!/bin/bash
# Worker Node Setup Script

echo "Installing Java 21 (MUST match Master version)..."
sudo apt install fontconfig openjdk-21-jre -y

echo "Installing Docker..."
sudo apt install docker.io -y
sudo usermod -aG docker ubuntu
sudo systemctl enable docker && sudo systemctl start docker

echo "Providing permissions to Docker socket for Jenkins..."
sudo chmod 777 /var/run/docker.sock

echo "Installing Trivy..."
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | \
  sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update -y && sudo apt-get install trivy -y

echo "Worker Setup Complete!"
```

---

## Phase 4 — Jenkins CI Pipeline

### Jenkins Master-Worker Architecture
```
Jenkins Master (Brain)
    ├── Schedules jobs
    ├── Manages UI + credentials
    └── SSH --> Jenkins Worker (Muscle)
                   ├── git checkout
                   ├── SonarQube scan
                   ├── docker build
                   ├── trivy scan
                   └── docker push to DockerHub
```

### Jenkins Plugins Installed
| Plugin | Purpose |
|---|---|
| SonarQube Scanner | Connects Jenkins to SonarQube |
| Docker Pipeline | Allows Docker commands in pipeline |
| SSH Build Agents | Connects Jenkins to Worker via SSH |
| Workspace Cleanup | Cleans workspace before/after builds |
| OWASP Dependency Check | Scans dependencies for CVEs (optional) |

### Credentials Stored in Jenkins
| ID | Type | Used For |
|---|---|---|
| `dockerhub` | Username + Password | Pushing images to DockerHub |
| `github` | Username + PAT | Accessing GitHub repos |
| `sonarqube-token` | Secret Text | Authenticating with SonarQube |
| `ubuntu` | SSH Private Key (`terra-key`) | Jenkins SSHing into Worker Node |

### The Complete Jenkinsfile
```groovy
pipeline {
    agent {
        label 'Worker'   // Run ALL stages on the Worker node
    }

    environment {
        DOCKER_CREDS = credentials('dockerhub')
        SONAR_SCANNER_HOME = tool 'sonar-scanner'
    }

    stages {
        stage('Clean Workspace') {
            steps { cleanWs() }
        }

        stage('Checkout Code') {
            steps { checkout scm }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar-server') {
                    sh '''
                        $SONAR_SCANNER_HOME/bin/sonar-scanner \
                        -Dsonar.projectKey=TravelVerse \
                        -Dsonar.sources=.
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t $DOCKER_CREDS_USR/travelverse-frontend:latest .'
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t $DOCKER_CREDS_USR/travelverse-backend:latest .'
                }
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL $DOCKER_CREDS_USR/travelverse-frontend:latest'
                sh 'trivy image --severity HIGH,CRITICAL $DOCKER_CREDS_USR/travelverse-backend:latest'
            }
        }

        stage('Push Docker Images') {
            steps {
                sh 'echo $DOCKER_CREDS_PSW | docker login -u $DOCKER_CREDS_USR --password-stdin'
                sh 'docker push $DOCKER_CREDS_USR/travelverse-frontend:latest'
                sh 'docker push $DOCKER_CREDS_USR/travelverse-backend:latest'
            }
        }
    }

    post {
        always { cleanWs() }
    }
}
```

---

## Bug Log and Lessons Learned

### Bug 1: `Tool type "jdk" does not have an install of "jdk17" configured`
- **Cause:** Jenkinsfile referenced a JDK tool named `jdk17` that was not configured in Jenkins > Tools.
- **Fix:** Removed the `tools { jdk 'jdk17' }` block. Jenkins uses system Java directly.

### Bug 2: `UnsupportedClassVersionError: class file version 65.0`
- **Root Cause:** Jenkins Master was compiled with Java 21 (class version 65). Worker only had Java 17 (understands up to class version 61). The mismatch caused an immediate crash when Master sent code to Worker.
- **Fix:** Ran `sudo apt-get install openjdk-21-jre -y` on the Worker node.
- **Key Lesson:** Always keep Master and Worker on the **same Java version**.

### Bug 3: SonarQube Quality Gate hanging forever in PENDING state
- **Root Cause:** SonarQube runs inside a Docker container. The webhook URL pointed to the host's private AWS IP (`172.31.x.x`). From inside Docker, traffic to the host's private IP gets dropped by Docker's bridge network routing.
- **Fix Journey:**
  1. Public IP in webhook → Docker cannot reach out to public internet and back in (Hairpin NAT issue): FAILED
  2. Private IP `172.31.x.x` in webhook → Docker bridge routing drops the packet: FAILED
  3. Disabled "Enable local webhooks validation" in SonarQube → SSRF protection was the issue: PARTIAL FIX
  4. Changed webhook URL to Docker Host Bridge IP `http://172.17.0.1:8080/sonarqube-webhook/`: **SUCCESS**
- **Key Lesson:** `172.17.0.1` is the Docker host's address as seen from inside any container on Linux. It always works for container-to-host communication.

### Bug 4: Frontend blank page with `NS_ERROR_CORRUPTED_CONTENT`
- **Root Cause:** The frontend Dockerfile used `npm run dev` (Vite development server) in production. The Vite dev server uses hot-module replacement (HMR) WebSockets and in-memory caching designed for a single local machine. When multiple pods are behind a Load Balancer, clients hit different pods with different in-memory caches, causing corrupted responses.
- **Fix:** Rewrote the Dockerfile as a **multi-stage build**:
  - **Stage 1** (`node:18-alpine`): Runs `npm run build` to compile React into static HTML/CSS/JS in the `/dist` folder.
  - **Stage 2** (`nginx:alpine`): Copies only the `/dist` folder and serves it with Nginx — fast, stateless, production-safe.

### Bug 5: `Blocked request. This host is not allowed` (Vite 5+)
- **Root Cause:** Vite 5 introduced strict Host header validation to prevent DNS rebinding attacks. The AWS ELB hostname was not `localhost`, so Vite rejected all incoming requests.
- **Fix:** Added `allowedHosts: true` to `vite.config.js`. This became irrelevant once we switched to the Nginx production build.

### Bug 6: Quality Gate ERROR — Coverage on New Code less than 80%
- **Root Cause:** The default "Sonar way" Quality Gate requires 80% unit test coverage on all new code. Our project has no unit tests.
- **Fix:**
  1. Created a new custom Quality Gate named "DevOps way" (copied from "Sonar way").
  2. Set the Coverage threshold to `0%` (always passes).
  3. Deleted the "Security Hotspots Reviewed = 100%" and "Duplicated Lines > 3%" conditions.
  4. Set "DevOps way" as the Default gate.
  5. Updated the TravelVerse project in SonarQube to use this gate.

---

## Phase 5 — Kubernetes Cluster (AWS EKS)

### What is EKS?
Amazon Elastic Kubernetes Service (EKS) is a **managed Kubernetes service**. AWS fully manages the Control Plane (API server, etcd, scheduler, controller manager). You only manage the Worker Nodes (EC2 instances where pods run). This eliminates the complexity of setting up and maintaining the Kubernetes control plane yourself.

### Create the Cluster
```bash
eksctl create cluster \
  --name travelverse-cluster \
  --region ap-southeast-1 \
  --nodegroup-name travelverse-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 2
```

`eksctl` automatically creates:
- A new VPC with public and private subnets
- The EKS Control Plane (managed by AWS)
- An Auto Scaling Group with 2 × `t3.medium` Worker Nodes
- IAM roles for the cluster and node group
- Updates `~/.kube/config` so `kubectl` works immediately

### Verify
```bash
kubectl get nodes
# NAME                                             STATUS   ROLES    AGE   VERSION
# ip-192-168-53-28.ap-southeast-1.compute.internal Ready    none     13m   v1.34.9-eks-8f14419
# ip-192-168-75-49.ap-southeast-1.compute.internal Ready    none     13m   v1.34.9-eks-8f14419
```

---

## Phase 6 — Kubernetes Manifests

### Frontend (`k8s/frontend.yaml`)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: souravdasdocker/travelverse-frontend:latest
          ports:
            - containerPort: 80
          env:
            - name: VITE_API_URL
              value: "/api"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
spec:
  type: LoadBalancer
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
```

### Frontend Nginx Config (`frontend/nginx.conf`)
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Frontend Dockerfile (Multi-Stage)
```dockerfile
# Stage 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Phase 6 — ArgoCD GitOps Deployment

### What is GitOps?
GitOps means **GitHub is the single source of truth** for your cluster state. ArgoCD watches your GitHub repo and automatically applies any changes to the `k8s/` folder into the cluster. If someone manually changes a pod count in the cluster, ArgoCD detects the **drift** and restores it to match GitHub.

### Install ArgoCD
```bash
kubectl create namespace argocd
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Expose via Load Balancer
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "LoadBalancer"}}'

# Get URL
kubectl get svc argocd-server -n argocd

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d; echo
```

### ArgoCD Application Settings
| Setting | Value |
|---|---|
| Application Name | `travelverse` |
| Project | `default` |
| Sync Policy | `Automatic` + Self Heal + Prune |
| Repository URL | `https://github.com/SouravDasHriday/travelverse-mega-project.git` |
| Path | `k8s` |
| Cluster | `https://kubernetes.default.svc` |
| Namespace | `default` |

**Result:** ArgoCD showed **Healthy and Synced** — pods auto-deployed!

---

## Phase 7 — Monitoring with Prometheus and Grafana

### Stack Overview
| Tool | Role |
|---|---|
| Prometheus | Scrapes metrics from all pods/nodes every 15s, stores in time-series DB |
| Grafana | Connects to Prometheus, renders beautiful dashboards |
| kube-prometheus-stack | Helm chart that installs both + pre-built K8s dashboards |

### Install via Helm
```bash
helm repo add prometheus-community \
  https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Expose Grafana
kubectl patch svc monitoring-grafana -n monitoring \
  -p '{"spec": {"type": "LoadBalancer"}}'

# Get Grafana URL
kubectl get svc monitoring-grafana -n monitoring
```

### Grafana Login
| Field | Value |
|---|---|
| URL | `http://<GRAFANA_ELB_URL>` |
| Username | `admin` |
| Password | `prom-operator` |

### Dashboard Used
**Dashboards > Kubernetes / Compute Resources / Cluster**

Metrics observed:
- CPU Utilization: **4.23%** (healthy)
- Memory Utilization: **36.6%** (healthy)
- Network traffic per namespace: `argocd`, `kube-system`, `default`

---

## Phase 8 — Clean Up

> Always delete EKS BEFORE running Terraform destroy!

### Step 1: Delete EKS (on Master Node, ~15 minutes)
```bash
eksctl delete cluster --name travelverse-cluster --region ap-southeast-1
```
Deletes: Worker Nodes, Auto Scaling Group, Load Balancers, EKS Control Plane, EKS-managed VPC resources.

### Step 2: Destroy Terraform (on local Mac)
```bash
terraform destroy -auto-approve
```
Deletes: EC2 instances, Security Groups, Key Pair.

---

## Key Concepts Reference

### DevOps Concepts Mastered
| Concept | Tool | What It Does |
|---|---|---|
| Infrastructure as Code | Terraform | Provisions AWS from `.tf` files |
| Continuous Integration | Jenkins | Auto-builds and tests on every push |
| Static Code Analysis | SonarQube | Scans source code for bugs/security |
| Quality Gate | SonarQube | Blocks bad code from reaching production |
| Vulnerability Scanning | Trivy | Scans Docker images for known CVEs |
| Containerization | Docker | Packages app + dependencies portably |
| Container Registry | DockerHub | Stores versioned Docker images |
| Container Orchestration | Kubernetes/EKS | Manages containers at scale |
| GitOps/CD | ArgoCD | Auto-deploys on GitHub manifest changes |
| K8s Package Manager | Helm | One-command complex app installation |
| Metrics Collection | Prometheus | Scrapes and stores cluster metrics |
| Visualization | Grafana | Renders live dashboards from metrics |

### Important Port Numbers
| Service | Port |
|---|---|
| Jenkins | 8080 |
| SonarQube | 9000 |
| MongoDB | 27017 |
| Node.js Backend | 5000 |
| React (Dev/Vite) | 5173 |
| React (Prod/Nginx) | 80 |
| Grafana | 80 |
| ArgoCD | 443 |

### Critical IPs to Remember
| Address | Meaning |
|---|---|
| `172.17.0.1` | Docker Host IP (from inside a container) — used for SonarQube webhook |
| `172.31.x.x` | AWS VPC Private IP — use for internal service communication |

---

## Final Architecture Diagram

```
+---------------------------------------------------------------+
|                      AWS ap-southeast-1                       |
|                                                               |
|  +----------------------+   +----------------------------+    |
|  |   Master Node EC2    |   |    Worker Node EC2          |    |
|  |   (t2.large)         |   |    (t2.large)               |    |
|  |                      |   |                             |    |
|  |  Jenkins :8080  -----+---+-> Runs Pipeline Stages:    |    |
|  |  SonarQube :9000     |   |   git checkout              |    |
|  |  (Docker container)  |   |   sonar-scanner             |    |
|  |                      |   |   docker build              |    |
|  +----------------------+   |   trivy image scan          |    |
|                             |   docker push to DockerHub  |    |
|                             +----------------------------+    |
|                                                               |
|  +-----------------------------------------------------------+ |
|  |                 AWS EKS Cluster                           | |
|  |                                                           | |
|  |  ArgoCD        Prometheus    App Pods (default ns)        | |
|  |  (watches      + Grafana     frontend x2 (Nginx)          | |
|  |   GitHub)      (monitoring   backend  x2 (Node.js)        | |
|  |     |           namespace)   mongo    x1 (MongoDB)        | |
|  |     |                              |                      | |
|  |     |                    AWS Load Balancer (public)       | |
|  +-----------------------------------------------------------+ |
+---------------------------------------------------------------+
         |                                |
      DockerHub                        GitHub
    (image store)                (source of truth)
```

---

*Project completed: July 16, 2026*
*Total time: ~8 hours including debugging*
*Key bugs solved: 6 major issues documented above*
