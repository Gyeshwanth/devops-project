# DevSecOps Project - End-to-End CI/CD Setup Documentation

---

## 🏗️ Infrastructure Setup

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
Follow official Jenkins installation guide → [Jenkins Installation Guide](https://www.jenkins.io/doc/book/installing/linux/)

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
Use **OpenJDK 21 Headless** (headless = no GUI support).

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
# Fetch latest version
gitleaks_version=$(curl -s "https://api.github.com/repos/gitleaks/gitleaks/releases/latest" | grep -Po '"tag_name": "v\\K[0-9.]+')

# Download and install
wget -qO gitleaks.tar.gz https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_${gitleaks_version}_linux_x64.tar.gz
sudo tar xf gitleaks.tar.gz -C /usr/local/bin gitleaks

# Verify installation
gitleaks version

# Cleanup
rm -rf gitleaks.tar.gz
```

---

## 🧰 Trivy Setup (Vulnerability Scanning)

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

Install the following plugins:

* **NodeJS Plugin**
* **Pipeline Stage View**
* **SonarQube Scanner for Jenkins**

---

## 🛠️ Jenkins Configuration

### NodeJS Tool Setup

* Navigate to: **Manage Jenkins → Tools → NodeJS installations**
* Add a NodeJS version (e.g., `nodejs23`)
* Reference it inside the pipeline with:

```groovy
tools { nodejs 'nodejs23' }
```

### SonarQube Scanner Setup

1. **Manage Jenkins → Tools → SonarQube Scanner → Add Installation**

   * Name: `sonar-scanner`
2. **Generate and Add SonarQube Token**

   * Go to SonarQube → **Administration → Security → Tokens** → Generate Token
   * Go to Jenkins → Manage Credentials → Global → Add Credentials

      Kind: Secret Text
      
      Secret: Paste the SonarQube token
      
      *ID: sonar-token*

3. **Add SonarQube Server in Jenkins System Config:**

    * Manage Jenkins → System → SonarQube Servers → Add SonarQube
   * Name: `sonar`
   * URL: `http://<SONARQUBE_IP>:9000`
   * Choose Authentication Token

   

---

### Webhook Configuration (For Quality Gate)

SonarQube → **Administration → Configuration → Webhooks → Create New**

```
Name: Jenkins-Webhook
URL: http://<JENKINS_IP>:8080/sonarqube-webhook/
```

---

## 🧪 Jenkins Pipeline Script

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
        stage('Git Clone') {
            steps {
                git branch: 'dev', credentialsId: 'gitcred', url: 'https://github.com/Gyeshwanth/devops-project.git'
            }
        }

        stage('Frontend Compile') {
            steps {
                dir('client') {
                    sh 'find . -name "*.js" -exec node --check {} +' // Validates all JS syntax
                }
            }
        }

        stage('Backend Compile') {
            steps {
                dir('api') {
                    sh 'find . -name "*.js" -exec node --check {} +' // Ensures backend code syntax is valid
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
                sh 'trivy fs --format table -o fs-report.html .' // Generates HTML vulnerability report
            }
        }

        stage('Completion') {
            steps {
                echo 'Pipeline execution completed successfully!'
            }
        }
    }
}
```

🧠 abortPipeline: false ensures the pipeline doesn’t stop even if the Quality Gate fails — it just records the failure.
----------
---

## 🧾 Viewing Trivy Report in Jenkins

After pipeline execution:

```bash
cd /var/lib/jenkins/workspace/<JOB_NAME>/
ls -l
```

Look for:

```
fs-report.html   # Contains formatted vulnerability scan results
```

---

## ✅ Summary

This setup ensures **secure, automated, and quality-driven CI/CD** using DevSecOps principles:

* Continuous Integration → Jenkins + GitHub
* Static Code Analysis → SonarQube
* Secrets Scanning → Gitleaks
* Vulnerability Scanning → Trivy
* Continuous Deployment → Docker & Kubernetes
