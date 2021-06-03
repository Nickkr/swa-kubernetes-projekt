import { ContainerServiceClient } from '@azure/arm-containerservice';
import { ResourceManagementClient } from '@azure/arm-resources';
import {
  DeviceTokenCredentials,
  interactiveLogin,
  AzureCliCredentials
} from '@azure/ms-rest-nodeauth';
import { HttpService, Injectable, Logger } from '@nestjs/common';
import { CloudPlatformDeploymentService } from 'src/models/CloudPlatformDeploymentService.interface';
import { AzureCloudConfig } from 'src/schemas/AzureCloudConfig.schema';
import { TestJob } from 'src/schemas/TestJob.schema';
import {
  BillingManagementClient,
  BillingManagementModels,
  BillingManagementMappers
} from '@azure/arm-billing';

@Injectable()
export class AzureService {
  private readonly logger = new Logger(AzureService.name);

  constructor(private http: HttpService) {}

  private async login(tenantId: string) {
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
    const creds = await this.login(config.tenantId);
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
      config.ressourceGroupName,
      {
        location: config.location
      }
    );
    this.logger.log(rGroup);
    this.logger.log('------------ Creating Cluster ------------');
    await containerService.managedClusters.createOrUpdate(
      config.ressourceGroupName,
      config.clusterName,
      {
        location: config.location,
        aadProfile: {
          managed: true
        },
        dnsPrefix: 'testpro-dns',
        agentPoolProfiles: [
          {
            name: 'testpro',
            mode: 'System',
            count: 1,
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
        config.ressourceGroupName,
        config.clusterName
      );
    this.logger.log(kubeCredentials.kubeconfigs[0].value.toString());
    return kubeCredentials.kubeconfigs[0].value.toString();
  }

  public async getCost(config: AzureCloudConfig): Promise<number> {
    const creds = await this.login(config.tenantId);
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
                  Values: ['TestGroup']
                }
              }
            },
            timeframe: 'Custom',
            timePeriod: {
              from: '2021-05-01T00:00:00+00:00',
              to: '2021-05-31T23:59:59+00:00'
            }
          },
          {
            headers: {
              Authorization: 'Bearer ' + token.accessToken
            }
          }
        )
        .subscribe((response) => {
          //console.log(response.data.properties.rows[0][0]);
          console.log(response.data);
          resolve(5);
          //return response.data.properties.rows[0][0];
        });
    });
  }

  public async removeCluster(config: AzureCloudConfig) {
    this.logger.log('------- Removing Cluster -----');
    try {
      const creds = await this.login(config.tenantId);
      const resourceClient = new ResourceManagementClient(
        creds,
        config.subscriptionId
      );
      const rGroup = await resourceClient.resourceGroups.deleteMethod(
        config.ressourceGroupName
      );
      this.logger.log(rGroup);
    } catch (error) {
      this.logger.error('!! Error when removing cluster !!');
      this.logger.error(error);
    }
  }
}
