<<<<<<< HEAD
import { Injectable, Logger } from '@nestjs/common';
import { CloudPlatformDeploymentService } from 'src/models/CloudPlatformDeploymentService.interface';
import { AwsCloudConfig } from 'src/schemas/AwsCloudConfig.schema';
import { TestConfig } from 'src/schemas/TestConfig.schema';

import { KubeConfig } from '@kubernetes/client-node';



// EKS
import {
    EKSClient,
    AssociateEncryptionConfigCommand,
    CreateClusterCommand,
    DeleteClusterCommand,
    CreateNodegroupCommand,
    DeleteNodegroupCommand
} from "@aws-sdk/client-eks";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
// EC2
import {
    EC2Client,
    DescribeSubnetsCommand,
    DescribeVpcsCommand,
    DescribeSecurityGroupsCommand,
    DescribeInstanceTypesCommand
} from "@aws-sdk/client-ec2";

import {  ResourceGroupsClient, CreateGroupCommand, DeleteGroupCommand } from "@aws-sdk/client-resource-groups"

import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";


@Injectable()
export class AwsService implements CloudPlatformDeploymentService {
    private readonly logger = new Logger(AwsService.name);

    private eksclient:EKSClient;
    private ec2client:EC2Client;
    private resourceGroupsClient:ResourceGroupsClient;

    async login(config:AwsCloudConfig) {
        const creds = await defaultProvider({profile: config.profile});
        return creds;
    }


    async createCluster(config:AwsCloudConfig) :Promise<string> {
        this.logger.log('------------ Loggin in ------------');
        const creds = await this.login(config);
        this.eksclient = new EKSClient({
            region: config.location,
            credentials: creds
        });
        this.logger.log('------------ Creating Cluster ------------');

        const subnetIds = await this.getSubnetIds(config.vpcName);
        const securityGroupIds = await this.getSecurityGroupIds(config.vpcName);

        const roleArn = await this.getRoleArn(config);

        const createClusterCommand = new CreateClusterCommand({
            name: config.clusterName,
            resourcesVpcConfig: {
                subnetIds: subnetIds,
                securityGroupIds: securityGroupIds
            },
            roleArn: roleArn,
            version: config.kubernetesVersion,
            tags: {
                "Name": config.clusterName
            }
        });

        var cluster = await this.sendCommand(this.eksclient, createClusterCommand);
        this.logger.log(`Cluster created at: ${cluster.createdAt}`);
        this.logger.log(`Cluster: ${cluster}`);

        this.logger.log('------------ Creating Nodegroup ------------');
        const createNodegroupCommand = new CreateNodegroupCommand({
            nodegroupName: config.nodegroupName,
            clusterName: cluster.clusterName,
            scalingConfig: {
                // number of nodes that the nodegroup should maintain
                desiredSize: config.nodeCount
            },
            instanceTypes: [ config.instanceType ],
            subnets: subnetIds,
            tags: {
                "Name": config.nodegroupName
            },
            version: config.kubernetesVersion,
            remoteAccess: {
                sourceSecurityGroups: securityGroupIds
            },
            nodeRole: config.nodeRole,
            amiType: config.amiType,
            capacityType: config.capacityType,
            diskSize: config.diskSize
        });

        const nodeGroup = await this.sendCommand(this.eksclient, createNodegroupCommand);

        this.logger.log('------------ Creating Ressourcegroup ------------');
        this.resourceGroupsClient = new ResourceGroupsClient({
            credentials: creds,
            region: config.location
        });

        const createGroupCommand = new CreateGroupCommand({
            Name: config.resourceGroupName,
            ResourceQuery: {
                Type: "TAG_FILTERS_1_0",
                Query: {
                    "ResourceTypeFilters": [
                        "eks",
                        "ec2",
                        "vpc"
                    ],
                    "TagFilters": [
                        {
                            "Key": "Name",
                            "Values": [
                                cluster.clusterName,
                                config.nodegroupName
                            ]
                        }
                    ]
                }.toString()
            }
        });
        const resourceGroup = await this.sendCommand(this.resourceGroupsClient, createGroupCommand);

       // Fetch KubernetesConfig
        this.logger.log('---------- Getting Kube Credentials ------------');
        const kubeCredentials = this.getKubeconfig(cluster,config);
        this.logger.log(kubeCredentials.toString());
        return kubeCredentials.toString();
    }

    async removeCluster(config:AwsCloudConfig) {
        this.logger.log('------- Remove Cluster: -----');
        try {
            this.logger.log('------- Removing Nodegroup -----');
            const deleteNodegroupCommand = new DeleteNodegroupCommand({
                clusterName: config.clusterName,
                nodegroupName: config.nodegroupName
            });

            const nodeGroup = await this.sendCommand(this.eksclient, deleteNodegroupCommand);
            this.logger.log(nodeGroup);
            this.logger.log('------- SUCCESSFULLY removed Nodegroup -----');

            this.logger.log('------- Removing Cluster -----');
            const deleteClusterCommand = new DeleteClusterCommand({
                name: config.clusterName
            });
            const cluster = await this.sendCommand(this.eksclient, deleteClusterCommand);
            this.logger.log(cluster);
            this.logger.log('------- SUCCESSFULLY removed Cluster -----');

            this.logger.log('------- Removing ResourceGroup -----');
            const deleteGroupCommand = new DeleteGroupCommand({
                Group: config.resourceGroupName
            });
            const resourcegroup = await this.sendCommand(this.resourceGroupsClient, deleteGroupCommand);
            this.logger.log(resourcegroup);
            this.logger.log('------- SUCCESSFULLY removed ResourceGroup -----');
        } catch (error) {
            this.logger.error('!! Error when removing cluster !!');
            this.logger.error(error);
        }
    }

    async getAvailableInstanceTypes(config:AwsCloudConfig,testConfig:TestConfig) {
        var command = new DescribeInstanceTypesCommand({
            Filters: [
                {
                    Name: "vcpu-info.valid-cores",
                    Values: [testConfig.coreCount.toString()]
                },
                {
                    Name: "supported-usage-class",
                    Values: [config.capacityType.toLowerCase()]
                }

            ]
        });
    }


    public async getCost(config:AwsCloudConfig):Promise<number> {
        const creds = await this.login(config);
        const costExplorerClient = new CostExplorerClient({
            credentials: creds,
            region: config.location,
            tls:true
        });
        const accountNumber = await this.getAccountNumber(config);
        var command = new GetCostAndUsageCommand({
            Filter: {
                "And": [
                    {
                        "Dimensions" :
                        {
                            "Key": "REGION",
                            "Values": [ config.location ]
                        }
                    },
                    {
                        "Dimensions": {
                            "Key" : "LINKED_ACCOUNT",
                            "Values": [ accountNumber ]
                        }
                    },
                    {
                    "Tags":
                        {
                            "Key": "Name",
                            "Values": [config.resourceGroupName]
                        },
                    }
                ]
            },
           Granularity: "DAILY",
           GroupBy: [
                {
                    "Key": config.resourceGroupName,
                    "Type": "TAG"
                }
           ],
           Metrics: [ "AmortizedCost", "BlendedCost", "NetAmortizedCost", "NetUnblendedCost", "NormalizedUsageAmount", "UnblendedCost", "UsageQuantity" ],
           TimePeriod: {
              Start: "2021-05-01T00:00:00+00:00",
              End: "2021-05-31T23:59:59+00:00"
           }
        });

        var response = await this.sendCommand(costExplorerClient, command);
        this.logger.log(response);
        return response.ResultsByTime["Total"]["Amount"];
    }

    private getCostManagementUrl(config: AwsCloudConfig) {
        return `https://ce.${config.location}.amazonaws.com`
    }

    private async getAccountNumber(config:AwsCloudConfig):Promise<string> {
        const creds = await this.login(config);
        const stsClient = new STSClient({
            region: config.location,
            credentials: creds
        });
        const command = new GetCallerIdentityCommand({});
        const response = await this.sendCommand(stsClient, command);
        return response.Account;
    }

    private async getRoleArn(config:AwsCloudConfig):Promise<string> {
        const accountNumber = await this.getAccountNumber(config);
        return this.getRoleArnString(config, accountNumber);
    }

    private getRoleArnString(config:AwsCloudConfig, accountNumber:string):string {
        return `arn:aws:iam::${accountNumber}:role/${config.clusterRole}/`;
    }


    /**
    * get the subnet ids
    * @params: vpcName:string is the tag of the VPC
    **/
    private async getSubnetIds(vpcName) {
        const vpcId = await this.getVpcId(vpcName);
        var params = {
            Filters: [
                {
                    Name: "vpc-id",
                    Values: [vpcId]
                }
            ]
        }
        var command = new DescribeSubnetsCommand(params);
        var response = await this.sendCommand(this.ec2client, command);

        var subnetIds:string[];
        if(response != null) {
            this.logger.log(response);
            // only extract subnet ids
            response.Subnets.forEach( (subnet) => {
                subnetIds.push(subnet.SubnetId);
            });
            // required if DescribeSubnetCommand returns multiple subnets in pagination mode
            // to get next subnets we have to send the NextToken value from the response
            // we are getting next subnets until NextToken = null
            while(response.NextToken != null) {
                params["NextToken"] = response.NextToken;
                command = new DescribeSubnetsCommand(params);
                response = await this.sendCommand(this.ec2client, command);
                response.Subnets.forEach( (subnet) => {
                    subnetIds.push(subnet.SubnetId);
                });
            }

            return subnetIds;
        }
        return null;
    }

    private async getVpcId(vpcName) {
        const command = new DescribeVpcsCommand({
            Filters: [
                {
                    Name: "tag:Name",
                    Values: [vpcName]
                }
            ]
        });
        const vpcs = await this.sendCommand(this.ec2client, command);
        return vpcs.Vpcs[0];
    }

    private async getSecurityGroupIds(vpcName) {
        // const vpcId = await this.getVpcId(vpcName);
        const params = {
            Filters: [
                {
                    Name: "tag:Name",
                    Values: [ vpcName ]
                }
            ]
        };
        var command = new DescribeSecurityGroupsCommand(params);
        var securityGroupIds:string[];
        var response = await this.sendCommand(this.ec2client, command);
        if(response != null) {
            // only extract subnet ids
            response.SecurityGroups.forEach( (sg) => {
                securityGroupIds.push(sg.GroupId);
            });

            // required if DescribeSubnetCommand returns multiple subnets in pagination mode
            // to get next subnets we have to send the NextToken value from the response
            // we are getting next subnets until NextToken = null
            while(response.NextToken != null) {
                params["NextToken"] = response.NextToken;
                command = new DescribeSecurityGroupsCommand(params);
                response = await this.sendCommand(this.ec2client, command);
                response.SecurityGroups.forEach( (sg) => {
                    securityGroupIds.push(sg.GroupId);
                });
            }

            return securityGroupIds;
        }
    }

    private async sendCommand(client, command) {
        try {
          const data = await client.send(command);
          return data;
          // process data.
        } catch (error) {
            const { requestId, cfId, extendedRequestId } = error.$metadata;
            this.logger.error({ requestId, cfId, extendedRequestId });
        }
        return null;
    }

    private async getKubeconfig(cluster,config:AwsCloudConfig):Promise<KubeConfig> {
        // get Account
        const creds = await this.login(config);

        const stsClient = new STSClient({
            credentials: creds,
            region: config.location
        });
        const command = new GetCallerIdentityCommand({});
        const response = await this.sendCommand(stsClient, command);

        var kubeconfig = new KubeConfig();
        kubeconfig.loadFromOptions({
            clusters: [
                {
                    "server": cluster.endpoint,
                    "certificate-authority": cluster.certificateAuthority.data,
                    "name": cluster.name
                }
            ],
            contexts: [
                {
                    cluster: cluster.name,
                    user: response.Account,
                    name: `${cluster.name}-config`
                }
            ],
            currentContext: `${cluster.name}-config`,
            users: [
                {
                    name: response.Account,
                    exec: {
                        apiVersion: 'client.authentication.k8s.io/v1beta1',
                        command: 'aws',
                        args: [
                            "eks", "get-token",
                            "--cluster-name", "<cluster-name>",
                            "--role-arn", this.getRoleArnString(config, response.Account)
                        ]
                    }
                }
            ]
        });
        return kubeconfig;
   }
}
=======
import { Injectable, Logger } from '@nestjs/common';
import { CloudPlatformDeploymentService } from 'src/models/CloudPlatformDeploymentService.interface';
import { AwsCloudConfig } from 'src/schemas/AwsCloudConfig.schema';
import { TestConfig } from 'src/schemas/TestConfig.schema';

import { randomUUID } from 'crypto';

// EKS
import {
    EKSClient,
    AssociateEncryptionConfigCommand,
    CreateClusterCommand,
    DeleteClusterCommand,
    CreateNodegroupCommand,
    DeleteNodegroupCommand,
    DescribeClusterCommand,
    DescribeClusterCommandOutput,
    CreateClusterCommandOutput,
    DeleteNodegroupCommandOutput,
    DeleteClusterCommandOutput,
    waitUntilClusterActive,
    CreateNodegroupCommandOutput,
    waitUntilNodegroupActive,
    waitUntilNodegroupDeleted,
    waitUntilClusterDeleted,
    Nodegroup,
    Cluster,
    UpdateAddonCommand,
    DescribeNodegroupCommand,
    CreateAddonCommand,
    waitUntilAddonActive
} from "@aws-sdk/client-eks";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
// EC2
import {
    EC2Client,
    DescribeSubnetsCommand,
    DescribeVpcsCommand,
    DescribeSecurityGroupsCommand,
    DescribeInstanceTypesCommand,
    DescribeVpcsCommandOutput,
    DescribeSecurityGroupsCommandOutput,
    DescribeSubnetsCommandOutput,
} from "@aws-sdk/client-ec2";

import {  ResourceGroupsClient, CreateGroupCommand, DeleteGroupCommand } from "@aws-sdk/client-resource-groups"

import { STSClient, GetCallerIdentityCommand, AssumeRoleWithSAMLCommand } from "@aws-sdk/client-sts";

import { 
    IAMClient,
    CreateRoleCommand,
    CreateRoleCommandOutput, 
    Role,
    DeleteRoleCommand,
    DeleteRoleCommandOutput,
    AttachRolePolicyCommand,
    AttachRolePolicyCommandOutput,
    DetachRolePolicyCommand,
    DetachRolePolicyCommandOutput,
    CreateOpenIDConnectProviderCommand,
    CreateOpenIDConnectProviderCommandOutput,
    DeleteOpenIDConnectProviderCommand,
} from "@aws-sdk/client-iam";

import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import * as path from 'path';
import * as fs from 'fs';
import { KubeConfig } from '@kubernetes/client-node';
const util = require('util');
var exec  = util.promisify(require('child_process').exec);

@Injectable()
export class AwsService implements CloudPlatformDeploymentService {
    
    /**
   * generates the name out of testId as the prefix and the given name
   * @param testId is the test id given as string
   * @param name is the name appended after the prefix
   * @returns 'Test-<testId>-<name>'
   */
    generateName(testId:string, name:string):string {
        return `Test-${testId}-${name}`;
    }
    private readonly logger = new Logger(AwsService.name);


    async login(config:AwsCloudConfig) {
        const creds = await defaultProvider({profile: config.profile});
        return creds;
    }

    /**
     * creates a Cluster on AWS Elastic Kubernetes Services (EKS) and creates a nodegroup with a given number of nodes
     * according to https://docs.aws.amazon.com/eks/latest/userguide/getting-started-console.html#eks-create-cluster
     * @param config 
     * @param testId 
     * @returns 
     */
    async createCluster(config:AwsCloudConfig) :Promise<string> {
        this.logger.log(config._id);
        
        const createKeyPairCommand = `aws ec2 create-key-pair --profile "${config.profile}" --region ${config.location} --key-name ${this.generateName(config._id,'myKeyPair')}`+
        ` --query 'KeyMaterial' --output text > "${path.join(__dirname,`aws/${this.generateName(config._id, 'myKeyPair')}.pem`)}"`;
        this.logger.log(createKeyPairCommand);
        await exec(createKeyPairCommand);
        const chmodCommand = `chmod 400 "${path.join(__dirname, `aws/${this.generateName(config._id,'myKeyPair')}.pem`)}"`;
        this.logger.log(chmodCommand);
        await exec(chmodCommand);
        
        const createClusterCommand = `eksctl create cluster --name ${this.generateName(config._id, 'Cluster')} --region ${config.location}` +
        ` --with-oidc --ssh-access --ssh-public-key ${this.generateName(config._id,'myKeyPair')} --managed` +
        ` -p ${config.profile} --kubeconfig "${path.join(__dirname,'aws/.kube/config')}" --nodes ${config.nodeCount} --instance-types=${config.instanceType}`;
        this.logger.log(createClusterCommand);
        await exec(createClusterCommand);

       // Fetch KubernetesConfig
        this.logger.log('---------- Getting Kube Credentials ------------');
        const kubeconfig = fs.readFileSync(path.join(__dirname, 'aws/.kube/config'));
        const kubeCredentials = kubeconfig.toString();
        this.logger.log(kubeCredentials);
        return kubeCredentials;
    }

    async removeCluster(config:AwsCloudConfig) {
       try {
            await exec(`eksctl delete cluster --name ${this.generateName(config._id, 'Cluster')} --region ${config.location} -p ${config.profile}`);
        } catch (error) {
            this.logger.error('!! Error when removing cluster !!');
            this.logger.error(error);
        }
    }

    public async getCost(config:AwsCloudConfig):Promise<number> {
        const creds = await this.login(config);
        const costExplorerClient = new CostExplorerClient({
            credentials: creds,
            region: config.location,
            tls:true
        });
        const accountNumber = await this.getAccountNumber(config);
        var command = new GetCostAndUsageCommand({
            Filter: {
                "And": [
                    {
                        "Dimensions" :
                        {
                            "Key": "REGION",
                            "Values": [ config.location ]
                        }
                    },
                    {
                        "Dimensions": {
                            "Key" : "LINKED_ACCOUNT",
                            "Values": [ accountNumber ]
                        }
                    },
                    {
                    "Tags":
                        {
                            "Key": "Name",
                            "Values": [`eksctl-${this.generateName(config._id,'Cluster')}-cluster/VPC`]
                        },
                    }
                ]
            },
           Granularity: "DAILY",
           GroupBy: [
                {
                    "Key": config.vpcName,
                    "Type": "TAG"
                }
           ],
           Metrics: [ "AmortizedCost", "BlendedCost", "NetAmortizedCost", "NetUnblendedCost", "NormalizedUsageAmount", "UnblendedCost", "UsageQuantity" ],
           TimePeriod: {
              Start: "2021-05-01T00:00:00+00:00",
              End: "2021-05-31T23:59:59+00:00"
           }
        });

        var response = await this.sendCommand(costExplorerClient, command);
        this.logger.log(response.toString());
        return response.ResultsByTime["Total"]["Amount"];
    }

    public async getAvailableInstanceTypes(config:AwsCloudConfig,testConfig:TestConfig) {
        var command = new DescribeInstanceTypesCommand({
            Filters: [
                {
                    Name: "vcpu-info.valid-cores",
                    Values: [testConfig.coreCount.toString()]
                },
                {
                    Name: "supported-usage-class",
                    Values: [config.capacityType.toLowerCase()]
                }

            ]
        });
    }

   

    /**
     * sends an command using the given client
     * @param client the client to send the command with
     * @param command the command to send
     * @returns 
     */
    private async sendCommand(client, command) {
        try {
          const data = await client.send(command);
          return data;
          // process data.
        } catch (error) {
            // const { requestId, cfId, extendedRequestId } = error.$metadata;
            this.logger.error(error);
        }
        return null;
    }

    private async getAccountNumber(config:AwsCloudConfig):Promise<string> {
        const creds = await this.login(config);
        const stsClient = new STSClient({
            region: config.location,
            credentials: creds
        });
        const command = new GetCallerIdentityCommand({});
        const response = await this.sendCommand(stsClient, command);
        return response.Account;
    }
}
>>>>>>> 90742f699319700b0f410d275fb3c6b9bff849f9
