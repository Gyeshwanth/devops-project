pipeline {
    agent any
       
       tools {
            nodejs 'nodejs23'
          
       }
       environment {
          SCANNER_HOME = tool 'sonar-scanner' 
       }


    stages {
        stage('git clone') {
            steps {
               git branch: 'dev', credentialsId: 'gitcred', url: 'https://github.com/Gyeshwanth/devops-project.git'
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
        
         stage('done') {
            steps {
              echo 'done!'
            }
        }
    }
}
