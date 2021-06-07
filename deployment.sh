# Als Basis des Scripts dient der hier beschriebene Ablauf: https://docs.microsoft.com/de-de/azure/aks/kubernetes-walkthrough
# Setzen der Umgebungsvariablen
set -o allexport
source .env
set +o allexport

echo $TENANT_ID

# Installation der Azure CLI
# Source: https://docs.microsoft.com/de-de/cli/azure/install-azure-cli-linux?pivots=apt
read -p "Do you want to install the Azure CLI? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
  fi

# Anmelden bei Azure mit der Azure CLI
# Standardmäßig wird der Browser geöffnet, für einen device code flow mit --use-device-code aufrufen
# Doku: https://docs.microsoft.com/de-de/azure/active-directory/develop/v2-oauth2-device-code
# Prüfen, welche Parameter hier wirklich benötigt werden.
az login

# Erstellen einer Resourcengruppe
read -p "Create new resource group? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    az group create --name $RESOURCE_GROUP_NAME --location $RESOURCE_GROUP_LOCATION
  fi

# Erstellen eines AKS-Clusters
az aks create --resource-group $RESOURCE_GROUP_NAME --name $CLUSTER_NAME --node-count $CLUSTER_NODES --enable-addons monitoring --generate-ssh-keys --node-vm-size Standard_DS1_v2

# Installation von kubectl
read -p "Do you want to install kubectl? (y/N) " decision
  if [ "$decision" != "N" ] && [ "$decision" != "n" ]; then
    az aks install-cli
  fi

# Credentials für kubectl setzen.
az aks get-credentials --resource-group $RESOURCE_GROUP_NAME --name $CLUSTER_NAME

# Deployment der in der kubernetes.yaml definierten Anwendung
kubectl apply -f configurable.yaml

#Überwachen des Deployments
kubectl get service app-demo --watch

# Löschen des Clusters
#az group delete --name $RESOURCE_GROUP_NAME --yes --no-wait

