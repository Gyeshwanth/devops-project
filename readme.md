# DevSecOps Project - End-to-End CI/CD Setup Documentation

---

## 🏷️ Infrastructure Setup

**Tools and Components:**

* **GitHub** – Source code repository.
* **Jenkins** – CI/CD automation server.
* **SonarQube** – Static code analysis for quality and security.
* **Trivy** – Scanning dependencies and Docker images for vulnerabilities.
* **Docker** – Containerization of applications.
* **Kubernetes (K8s)** – Container orchestration and management platform.

---

| Language | Dependency File  |
| -------- | ---------------- |
| Java     | pom.xml          |
| Node.js  | package.json     |
| .NET     | .csproj          |
| Python   | requirements.txt |

---

## ⚙️ CI/CD Workflow Overview

**Pipeline Flow:**

```
GitHub → Compile → Gitleaks (Secrets Check) → Trivy (Dependency Vulnerability Scan) →
SonarQube (Static Code Analysis) → Quality Gate Check → Docker Build →
Trivy (Image Vulnerability Scan) → DockerHub Push → Kubernetes Deployment
```

---

## ☁️ Server Setup

**EC2 Configuration:**

* Create **2 EC2 instances**:

  * Jenkins Server
  * SonarQube Server
* Instance Type: `t2.medium`
* OS: **Ubuntu 25**
* Configure Security Group and Key Pair.
* Connect to both servers using **MobaXterm**.

---

## ⚙️ Jenkins Setup

**1. Install Jenkins:**

```bash
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install jenkins -y
```

**2. Install Java:**
Use **OpenJDK 21 Headless**.

**3. Access Jenkins:**

```
http://<JENKINS_PUBLIC_IP>:8080
```

Retrieve initial admin password:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

**4. Configure Jenkins:**

* Install **Suggested Plugins**
* Create Admin User → Username: `yeshwanth`, Password: `java`

---

## 🧠 SonarQube Setup (with Docker)

**1. Install Docker:**

```bash
sudo apt update
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker
```

**2. Run SonarQube Container:**

```bash
docker run -d --name sonar -p 9000:9000 sonarqube:lts-community
```

**3. Access SonarQube:**

```
http://<SONARQUBE_PUBLIC_IP>:9000
```

Default credentials:

```
Username: admin
Password: admin
```

Change password → `java`

---

## 🔐 Gitleaks Setup (Secrets Scanning)

```bash
sudo apt install gitleaks -y
```

---

## 🧮 Trivy Setup (Vulnerability Scanning)

```bash
sudo apt-get install wget apt-transport-https gnupg lsb-release -y
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy -y

# Verify version
trivy --version
```

---

## 🔌 Jenkins Plugins

* **NodeJS Plugin**
* **Pipeline Stage View**
* **SonarQube Scanner for Jenkins**
* **Docker Pipeline**
* **Docker Compose Build Step Plugin**

---

## 🛠️ Jenkins Configuration

### NodeJS Tool Setup

```
Manage Jenkins → Tools → NodeJS installations → Add → nodejs23
```

### SonarQube Scanner Setup

```
Manage Jenkins → Tools → SonarQube Scanner → Add Installation → sonar-scanner
```

Generate a token in SonarQube and add it as **Secret Text Credential (ID: sonar-token)**.

Add SonarQube server config:

```
Manage Jenkins → System → SonarQube Servers → Add SonarQube
Name: sonar
URL: http://<SONARQUBE_IP>:9000
Authentication: sonar-token
```

Webhook for Quality Gate:

```
SonarQube → Administration → Configuration → Webhooks → Create →
Name: Jenkins-Webhook
URL: http://<JENKINS_IP>:8080/sonarqube-webhook/
```

---

## 🚀 Docker Setup in Jenkins VM

```bash
sudo apt install docker.io -y
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

Install Docker Compose:

```bash
sudo curl -SL https://github.com/docker/compose/releases/download/v2.40.0/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 💪 Docker Compose Configuration (root directory)

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8
    container_name: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: java
      MYSQL_DATABASE: crud_app
    volumes:
      - mysql-data:/var/lib/mysql
      - ./mysql-init:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  backend:
    build: ./api
    container_name: backend-api
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: java
      DB_NAME: crud_app
      JWT_SECRET: SuperSecretKey
      RESET_ADMIN_PASS: 'true'
    depends_on:
      - mysql
    ports:
      - "5000:5000"

  frontend:
    build: ./client
    container_name: frontend-react
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  mysql-data:
```

---

## 🛠️ Multi-Stage Dockerfile Optimization

### Example: Backend (api/Dockerfile)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production=false
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

### Example: Frontend (client/Dockerfile)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static files
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 💡 Jenkins Pipeline Script

```groovy
pipeline {
    agent any

    tools {
        nodejs 'nodejs23'
    }

    environment {
        SCANNER_HOME = tool 'sonar-scanner'
    }

    stages {
        stage('Git Checkout') {
            steps {
                git branch: 'build', credentialsId: 'gitcred', url: 'https://github.com/Gyeshwanth/devops-project.git'
            }
        }

        stage('Frontend Compile') {
            steps {
                dir('client') {
                    sh 'find . -name "*.js" -exec node --check {} +'
                }
            }
        }

        stage('Backend Compile') {
            steps {
                dir('api') {
                    sh 'find . -name "*.js" -exec node --check {} +'
                }
            }
        }

        stage('Gitleaks Scan') {
            steps {
                sh 'gitleaks detect --source ./client --exit-code 1'
                sh 'gitleaks detect --source ./api --exit-code 1'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonar') {
                    sh '''$SCANNER_HOME/bin/sonar-scanner -Dsonar.projectName=NodeJS-Project \
                           -Dsonar.projectKey=NodeJS-Project'''
                }
            }
        }

        stage('Quality Gate Check') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false, credentialsId: 'sonar-token'
                }
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs --format table -o fs-report.html .'
            }
        }

        stage('Build & Push Backend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred') {
                        dir('api') {
                            sh 'docker build -t yeshwanthgosi/backend:latest .'
                            sh 'trivy image --format table -o backend-image-report.html yeshwanthgosi/backend:latest'
                            sh 'docker push yeshwanthgosi/backend:latest'
                        }
                    }
                }
            }
        }

        stage('Build & Push Frontend Image') {
            steps {
                script {
                    withDockerRegistry(credentialsId: 'docker-cred') {
                        dir('client') {
                            sh 'docker build -t yeshwanthgosi/frontend:latest .'
                            sh 'trivy image --format table -o frontend-image-report.html yeshwanthgosi/frontend:latest'
                            sh 'docker push yeshwanthgosi/frontend:latest'
                        }
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                sh 'docker-compose up -d'
            }
        }

        stage('Done') {
            steps {
                echo 'Pipeline completed successfully!'
            }
        }
    }
}
```

---

## 🔢 Useful Docker Commands

```bash
# View container logs
docker logs <container_id>

# Stop and remove all containers
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)

# Remove all images
docker rmi -f $(docker images -aq)
```

---

## ✅ Summary

This project demonstrates a **complete DevSecOps CI/CD pipeline** that integrates security, quality, and automation:

* **Continuous Integration** → Jenkins + GitHub
* **Static Code Analysis** → SonarQube
* **Secrets Scanning** → Gitleaks
* **Vulnerability Scanning** → Trivy
* **Continuous Deployment** → Docker & Kubernetes

All components together ensure a **secure, optimized, and production-ready** delivery workflow.
