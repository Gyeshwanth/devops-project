pipeline {
    agent any

    tools {
        nodejs 'nodejs23'
    }

   environment {
       SCANNER_HOME = tool 'sonar-scanner'
   }


    stages {
        stage('git checkout') {
            steps {
                git branch: 'build', credentialsId: 'gitcred', url: 'https://github.com/Gyeshwanth/devops-project.git'
            }
        }
        
         stage('frontend compile') {
            steps {
                 dir('client') {
                      sh 'find . -name "*.js" -exec node --check {} +'
                 }
            }
        }
        
        stage('backend compile') {
            steps {
                 dir('api') {
                      sh 'find . -name "*.js" -exec node --check {} +'
                 }
            }
        }
        
        stage('git leaks') {
            steps {
                sh 'gitleaks detect --source ./client --exit-code 1'
                sh 'gitleaks detect --source ./api --exit-code 1' 
            }
        }
        
         stage('SonarQube Analysis') {
            steps {
               withSonarQubeEnv('sonar') {
          sh ''' $SCANNER_HOME/bin/sonar-scanner -Dsonar.projectName=NodeJS-Project \
                            -Dsonar.projectKey=NodeJS-Project '''
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
        
         stage('Build-Tag & Push Backend Docker Image') {
            steps {
              script {
        withDockerRegistry(credentialsId: 'docker-cred') {
          
           dir('api') {
               sh 'docker build -t yeshwanthgosi/backend:latest .'
                sh 'trivy image --format table -o backend-image-report.html yeshwanthgosi/backend:latest '
               sh 'docker push yeshwanthgosi/backend:latest'
           }
              }
            }
        }
    }
         stage('Build-Tag & Push Frontend Docker Image') {
            steps {
              script {
        withDockerRegistry(credentialsId: 'docker-cred') {
          
           dir('client') {
               sh 'docker build -t yeshwanthgosi/frontend:latest .'
               sh 'trivy image --format table -o frontend-image-report.html yeshwanthgosi/frontend:latest '
               sh 'docker push yeshwanthgosi/frontend:latest'
           }
              }
            }
        }
    }
      
      
        stage('docker-compose') {
            steps {
             script {
                 sh 'docker-compose up -d '
             }
            }
        }
        
        
        
         stage('done') {
            steps {
              echo 'done!'
            }
        }
        
    }
}
