# Als Basis des Scripts dient der hier beschriebene Ablauf: https://docs.microsoft.com/de-de/azure/aks/kubernetes-walkthrough
# Setzen der Umgebungsvariablen
set -o allexport
source .env
set +o allexport

echo $TENANT_ID

cliversion="2.2.1"
# Installation der AWS CLI
# Source: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html
read -p "Do you want to install the AWS CLI? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
	unzip awscliv2.zip
	./aws/install
  fi

# Anmelden bei AWS mit der AWS CLI
# Standardmäßig wird der Browser geöffnet, für einen device code flow mit --use-device-code aufrufen
# Doku: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
# Prüfen, welche Parameter hier wirklich benötigt werden.
aws configure sso

# Erstellen einer Resourcengruppe
read -p "Create new resource group? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    aws resource-groups create group --name $RESOURCE_GROUP_NAME \
	# --location $RESOURCE_GROUP_LOCATION ?
  fi

# Erstellen eines EKS-Clusters
# https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html
aws eks create-cluster --region $AWS_REGION --name $CLUSTER_NAME --role-arn $ROLE_ARN --kubernetes-version $KUBERNETES_VERSION  \
--resources-vpc-config $RESOURCES_VPC_CONFIG


# Installation von kubectl
read -p "Do you want to install kubectl? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.19.6/2021-01-05/bin/linux/amd64/kubectl
	chmod +x ./kubectl
	mkdir -p $HOME/bin && cp ./kubectl $HOME/bin/kubectl && export PATH=$PATH:$HOME/bin
	echo 'export PATH=$PATH:$HOME/bin' >> ~/.bashrc
  fi

# Credentials für kubectl setzen.
# retrieve endpoint
# aws eks --region $AWS_REGION describe-cluster --name $CLUSTER_NAME --query "cluster.endpoint" --output text
# Retrieve the certificateAuthority.data.
# aws eks --region $AWS_REGION describe-cluster --name $CLUSTER_NAME --query "cluster.certificateAuthority.data" --output text

# create kubeconfig
# https://docs.aws.amazon.com/eks/latest/userguide/create-kubeconfig.html
# aws eks --region $AWS_REGION update-kubeconfig --name $CLUSTER_NAME
# test configuration
# kubectl get svc

# Deployment der in der kubernetes.yaml definierten Anwendung
# kubectl apply -f kubernetes.yaml

#Überwachen des Deployments
# kubectl get service azure-vote-front --watch

# Löschen des Clusters
#az group delete --name $RESOURCE_GROUP_NAME --yes --no-wait

