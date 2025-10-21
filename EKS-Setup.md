# 📘 DevOps Tooling & EKS Setup Guide on Linux

This guide provides a comprehensive step-by-step process to install DevOps tools on Linux, set up an EKS cluster, configure IAM roles for service accounts, and deploy essential Kubernetes add-ons (EBS CSI Driver, NGINX Ingress Controller, cert-manager). The guide is fully corrected, structured, and formatted for clarity.

---

## 🖥️ EC2 Instance Requirements

* Instance Type: **t2.medium**


---

## 1️⃣ Install AWS CLI

AWS CLI is used to interact with AWS services from the terminal.

```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
sudo apt install unzip -y
unzip awscliv2.zip
sudo ./aws/install
aws --version
aws configure  # provide AWS Access Key, Secret Key, region, and output format
```

---

## 2️⃣ Install kubectl

`kubectl` is the Kubernetes command-line tool to manage clusters.

```bash
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client --short
```

---

## 3️⃣ Install eksctl

`eksctl` is used to create and manage EKS clusters.

```bash
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

---

## 4️⃣ Install Terraform

Terraform is used to provision AWS infrastructure as code.

```bash
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common curl
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install terraform -y
terraform --version
```

---

## 5️⃣ Configure kubeconfig for EKS

Connect `kubectl` to your EKS cluster.

```bash
aws eks --region <region> update-kubeconfig --name <cluster-name>
```

---

## 6️⃣ Associate IAM OIDC Provider

Allows Kubernetes pods to assume AWS IAM roles.

```bash
eksctl utils associate-iam-oidc-provider \
--region <region> \
--cluster <cluster-name> \
--approve
```

**Purpose:** Required when pods need to access AWS services like S3, DynamoDB, or EBS.

---

## 7️⃣ Create IAM Service Account for EBS CSI Driver

```bash
eksctl create iamserviceaccount \
--region <region> \
--name ebs-csi-controller-sa \
--namespace kube-system \
--cluster <cluster-name> \
--attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
--approve \
--override-existing-serviceaccounts
```

**Purpose:** Grants EKS permissions to dynamically provision EBS volumes for pods when using storage that is managed by Kubernetes.

**Use Case:**

* **Dynamic storage required:** If your application uses Kubernetes-managed persistent volumes (PV) for storing data, this setup is required.
* **Not needed:** If the application stores data in a fully managed cloud service (e.g., RDS, DynamoDB) and does not require direct block storage, EBS CSI is not required.

**Flow for Dynamic Provisioning:**

```
PersistentVolume (PV) > PersistentVolumeClaim (PVC) > StorageClass (SC) > CSI Driver > AWS EBS Volume
```

---

## 8️⃣ Deploy Kubernetes Add-ons

### a) EBS CSI Driver (Storage)

```bash
kubectl apply -k "github.com/kubernetes-sigs/aws-ebs-csi-driver/deploy/kubernetes/overlays/stable/ecr/?ref=release-1.11"
```

**Purpose:** Dynamic provisioning of persistent volumes for pods using AWS EBS.

### b) NGINX Ingress Controller (Traffic Management)

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

**Purpose:** Handles external HTTP/HTTPS traffic and routes it to services.

### c) cert-manager (SSL Certificates)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
```

**Purpose:** Automates issuance and renewal of SSL/TLS certificates for secure HTTPS traffic.

---

## 9️⃣ Running Terraform

1. Clone the repository:

```bash
git clone https://github.com/Gyeshwanth/Terraform-devops-project.git
cd Terraform-devops-project
```

2. Update `variables.tf` with your AWS key-pair and other configuration.
3. Update `main.tf` to set the correct region and settings.
4. Initialize and apply Terraform:

```bash
terraform init
terraform plan
terraform apply --auto-approve
```

**Purpose:** Creates EKS cluster, VPC, and required AWS resources automatically.

---

## 🔗 Connecting Pods to AWS Services

Pods can access AWS services using IAM roles associated with service accounts.

```bash
eksctl utils associate-iam-oidc-provider --cluster <your-cluster-name> --approve
```

**Use case:** Pods can securely communicate with S3, EBS, DynamoDB without embedding credentials.

---

### ✅ Summary of Add-ons & Purpose

| Add-on         | Purpose                              | Required When                                                                                  |
| -------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| EBS CSI Driver | Dynamic volume provisioning for pods | Pods need persistent storage on AWS EBS; not required for fully managed cloud storage services |
| NGINX Ingress  | HTTP/HTTPS traffic routing           | External access to services                                                                    |
| cert-manager   | SSL/TLS automation                   | HTTPS security for services                                                                    |
| IAM OIDC       | Associate IAM roles with pods        | Pods access AWS services                                                                       |

---

This document is formatted for clarity and can be saved as a `.md` file using any text editor or via Canva for documentation purposes.
