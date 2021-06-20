import { ContainerServiceClient } from '@azure/arm-containerservice';
import { ResourceManagementClient } from '@azure/arm-resources';
import { AzureCliCredentials } from '@azure/ms-rest-nodeauth';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { AzureCloudConfig } from 'src/schemas/AzureCloudConfig.schema';

@Injectable()
export class AzureService {
  private readonly logger = new Logger(AzureService.name);

  constructor(private http: HttpService) {}

  private async login() {
    /*     const creds = await interactiveLogin({
          domain: tenantId
        });
        return creds; */
    const creds = await AzureCliCredentials.create();
    return creds;
  }

  private getCostManagementUrl(config: AzureCloudConfig) {
    return `https://management.azure.com/subscriptions/${config.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2019-11-01&$top=5000`;
  }

  public async createCluster(config: AzureCloudConfig): Promise<string> {
    this.logger.log('------------ Loggin in ------------');
    const creds = await this.login();
    const containerService = new ContainerServiceClient(
      creds,
      config.subscriptionId
    );
    this.logger.log('------------ Creating Ressourcegroup ------------');
    const resourceClient = new ResourceManagementClient(
      creds,
      config.subscriptionId
    );
    const rGroup = await resourceClient.resourceGroups.createOrUpdate(
      config.resourceGroupName,
      {
        location: config.location
      }
    );
    this.logger.log(rGroup);
    this.logger.log('------------ Creating Cluster ------------');
    const cluster = await containerService.managedClusters.createOrUpdate(
      config.resourceGroupName,
      config.clusterName,
      {
        location: config.location,
        nodeResourceGroup: this.getClusterResourceGroupName(config),
        aadProfile: {
          managed: true
        },
        dnsPrefix: 'testpro-dns',
        agentPoolProfiles: [
          {
            name: 'testpro',
            mode: 'System',
            count: config.nodeCount,
            vmSize: 'Standard_DS2_v2'
          }
        ],
        identity: {
          type: 'SystemAssigned'
        }
      }
    );
    //this.logger.log(options);
    // Fetch KubernetesConfig
    this.logger.log('---------- Getting Kube Credentials ------------');
    const kubeCredentials =
      await containerService.managedClusters.listClusterAdminCredentials(
        config.resourceGroupName,
        config.clusterName
      );
    this.logger.log(kubeCredentials.kubeconfigs[0].value.toString());
    return kubeCredentials.kubeconfigs[0].value.toString();
  }

  public async getCost(config: AzureCloudConfig): Promise<number> {
    const creds = await this.login();
    const token = await creds.getToken();
    return new Promise((resolve, reject) => {
      this.http
        .post(
          this.getCostManagementUrl(config),
          {
            type: 'ActualCost',
            dataSet: {
              granularity: 'None',
              aggregation: {
                totalCost: {
                  name: 'Cost',
                  function: 'Sum'
                }
              },
              grouping: [
                {
                  type: 'Dimension',
                  name: 'ResourceGroupName'
                },
                {
                  type: 'Dimension',
                  name: 'ChargeType'
                },
                {
                  type: 'Dimension',
                  name: 'PublisherType'
                }
              ],
              filter: {
                Dimensions: {
                  Name: 'ResourceGroupName',
                  Operator: 'In',
                  Values: [this.getClusterResourceGroupName(config)]
                }
              }
            },
            timeframe: 'Custom',
            timePeriod: {
              from: '2021-06-01T00:00:00+00:00',
              to: '2021-06-30T23:59:59+00:00'
            }
          },
          {
            headers: {
              Authorization: 'Bearer ' + token.accessToken
            }
          }
        )
        .subscribe((response) => {
          console.log(response.data);
          if (response.data.properties.rows.length > 0) {
            resolve(response.data.properties.rows[0][0]);
          } else {
            resolve(null);
          }
        });
    });
  }

  getClusterResourceGroupName(config: AzureCloudConfig) {
    return config.clusterName + '-' + config.resourceGroupName;
  }

  public async removeCluster(config: AzureCloudConfig) {
    this.logger.log('------- Removing Cluster -----');
    try {
      const creds = await this.login();
      const resourceClient = new ResourceManagementClient(
        creds,
        config.subscriptionId
      );
      const rGroup = await resourceClient.resourceGroups.deleteMethod(
        config.resourceGroupName
      );
      this.logger.log(rGroup);
    } catch (error) {
      this.logger.error('!! Error when removing cluster !!');
      this.logger.error(error);
    }
  }
}
