pipeline {
    agent {
        label 'Worker'
    }
    
    environment {
        DOCKER_CREDS = credentials('dockerhub')
        SONAR_SCANNER_HOME = tool 'sonar-scanner'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        // stage('OWASP Dependency-Check') {
        //     steps {
        //         dependencyCheck additionalArguments: '--scan ./ --disableYarnAudit --disableNodeAudit', odcInstallation: 'DP-Check'
        //         dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
        //     }
        // }

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

        // stage('Quality Gate') {
        //     steps {
        //         timeout(time: 1, unit: 'HOURS') {
        //             waitForQualityGate abortPipeline: true
        //         }
        //     }
        // }

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
        always {
            cleanWs()
        }
    }
}
