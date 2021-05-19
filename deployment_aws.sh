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

# Quelle: https://oneplatform.enbw.com/docs/aws/aws-login/#step-by-step-anleitung-fur-ubuntu-20-04-lts
#nvm und Node installieren
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
source ~/.bashrc
nvm install --lts

# aws-oneplatform-login installieren
curl "https://oneplatform.enbw.com/wp-content/uploads/2020/03/aws-oneplatform-login-0.0.3.tar.gz" -o "aws-oneplatform-login-0.0.3.tar.gz"
npm install -g aws-oneplatform-login-0.0.3.tar.gz

# Chrome hat fehlende Dependencies die noch installiert werden müssen
# https://techoverflow.net/2018/06/05/how-to-fix-puppetteer-error-while-loading-shared-libraries-libx11-xcb-so-1-cannot-open-shared-object-file-no-such-file-or-directory/
sudo apt-get update && sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget


aws-oneplatform-login --configure


# Anmelden bei AWS mit der AWS CLI

# Konfiguration für VcXsrv und 'aws-oneplatform-login --mode gui'
# damit kann ein Fenster geöffnet werden für den Login über MFA
export DISPLAY=$(cat /etc/resolv.conf | grep nameserver | awk '{print $2; exit;}'):0.0
export LIBGL_ALWAYS_INDIRECT=1

# Anmelden bei AWS mit der AWS CLI
aws-oneplatform-login --mode gui

# Befehl zur Überprüfung der Anmeldung
aws sts get-caller-identity

# Erstellen einer Resourcengruppe
read -p "Create new resource group? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    aws resource-groups create group --name $RESOURCE_GROUP_NAME \
	# --location $RESOURCE_GROUP_LOCATION ?
  fi

# Erstellen eines EKS-Clusters
# https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html
# aws eks create-cluster --region $AWS_REGION --name $CLUSTER_NAME --role-arn $ROLE_ARN --kubernetes-version $KUBERNETES_VERSION  \
--resources-vpc-config $RESOURCES_VPC_CONFIG


# Installation von kubectl
read -p "Do you want to install kubectl? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    curl -o kubectl https://amazon-eks.s3.us-west-2.amazonaws.com/1.19.6/2021-01-05/bin/linux/amd64/kubectl
    curl -o kubectl.sha256 https://amazon-eks.s3.us-west-2.amazonaws.com/1.19.6/2021-01-05/bin/linux/amd64/kubectl.sha256
    # check SHA256 checksum
    sha256sum -c kubectl.sha256
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

