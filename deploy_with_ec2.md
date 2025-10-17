# 3-Tier Project Deployment Guide

This README provides step-by-step instructions to set up and deploy a 3-tier project with **React.js frontend**, **Node.js/Express backend**, and **MySQL database** on an **AWS EC2 instance**.

---

## Project Architecture

```
Frontend
---------
JavaScript, React.js

Backend
--------
JavaScript, Node.js, Express.js

Database
---------
MySQL
```

### Security Groups (SG)

Allow the following ports for proper access:

| Port      | Purpose                 |
| --------- | ----------------------- |
| 22        | SSH                     |
| 80        | HTTP                    |
| 443       | HTTPS                   |
| 3000-9000 | Application specific    |
| 587       | SMTP / email (optional) |

> **Note:** No need to allow (3000-9000) range, simply  allow 3000 and 5000 ports for frontend(react.js) and backend(express.js)
> **Note:** Create and attach a Security Group with these ports before launching the EC2 instance.

---

## Step 1: Create EC2 Instance

1. Launch an EC2 instance with:

   * **AMI:** Ubuntu
   * **Instance type:** t2.medium
   * **Volume:** 25 GB
   * **Security Group:** Attach SG created above
2. Download the **private key (.pem)** file.

---

## Step 2: Connect to EC2

You can use any of the following options:

* **MobaXterm**
* **Linux Bash for Windows**
* **PuTTY**

**Example using MobaXterm:**

1. Open MobaXterm → Session → SSH.
2. Remote host: `EC2 public IP`.
3. Username: `ubuntu`.
4. Private key: Use the `.pem` file downloaded during EC2 creation.

---

## Step 3: Update Linux VM

```bash
# Switch to root (optional)
sudo su
# Or keep sudo for individual commands

# Update package index
sudo apt update -y
sudo apt upgrade -y
```

---

## Step 4: Install Node.js & NPM

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Activate NVM
\. "$HOME/.nvm/nvm.sh"

# Install Node.js v22
nvm install 22

# Verify Node.js and npm versions
node -v  # Should print v22.20.0
npm -v   # Should print 10.9.3
```

---

## Step 5: Clone Project

```bash
git clone -b dev <your-repo-url>
cd <project-directory>
```

---

## Step 6: Install & Setup MySQL Server

```bash
sudo apt install mysql-server -y

# Optional: Secure MySQL installation
sudo mysql_secure_installation
```

> **Important:** Update React client configuration to use the **EC2 public IP address** for API calls.

---

## Step 7: Start Backend

```bash
cd backend
npm install  # Install dependencies
npm start    # Start backend server
```

---

## Step 8: Start Frontend

```bash
cd frontend
npm install  # Install dependencies
npm start    # Start frontend server
```

---

## Step 9: Troubleshooting Commands

* **Check open ports:**

```bash
netstat -lntp
```

* **Test connectivity to MySQL:**

```bash
telnet localhost 3306
```

* **List running processes:**

```bash
ps
ps -ef
```

* **Stop a process:**

```bash
ps -ef | grep node
kill <PID>

# Or alternative
ps aux | grep node
kill <PID>
```

---

## References

* [Node.js Official](https://nodejs.org/en/download)
* [NVM Installation](https://github.com/nvm-sh/nvm)
* [MySQL Installation Guide](https://dev.mysql.com/doc/)

---

✅ **Now your 3-tier application should be running successfully on EC2 with frontend, backend, and database layers properly configured.**
