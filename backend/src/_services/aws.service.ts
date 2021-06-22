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


import { CostExplorerClient, DataUnavailableException, GetCostAndUsageCommand, GetCostAndUsageCommandOutput, Granularity } from "@aws-sdk/client-cost-explorer";
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
        const createClusterCommand = `eksctl create cluster --name ${this.generateName(config._id, 'Cluster')} --region ${config.location}` +
        ` --with-oidc --managed --node-volume-size ${config.diskSize}`+
        ` -p ${config.profile} --kubeconfig "${path.join(__dirname,'aws/.kube/config')}" --nodes 1 --instance-types=${config.instanceType}` +
        ` --tags swatest=${this.generateName(config._id, 'Cluster')}`;
        this.logger.log(createClusterCommand);
        const { stdout, stderr } = await exec(createClusterCommand);
        this.logger.log(stdout);
        this.logger.error(stderr);

       // Fetch KubernetesConfig
        this.logger.log('---------- Getting Kube Credentials ------------');
        const kubeconfig = fs.readFileSync(path.join(__dirname, 'aws/.kube/config'));
        const kubeCredentials = kubeconfig.toString();
        this.logger.log(kubeCredentials);
        return kubeCredentials;
    }

    async removeCluster(config:AwsCloudConfig) {
       try {
            const {stdout, stderr } = await exec(`eksctl delete cluster --name ${this.generateName(config._id, 'Cluster')} --region ${config.location} -p ${config.profile}`);
            this.logger.log(stdout);
            this.logger.error(stderr);
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
        const start = new Date(config.startDeploy);
        var end = new Date(config.endDeploy);
        end.setDate(end.getDate() + 1 );
        const startDate = start.toISOString().split("T")[0];
        const endDate = end.toISOString().split("T")[0];
        var command = new GetCostAndUsageCommand({
            Filter: {
                "And": [
                    {
                        "Dimensions" : {
                            "Key": "REGION",
                            "Values": [ config.location ]
                        }
                    },
                    {
                        "Tags": {
                            "Key": "swatest",
                            "Values": [ `${this.generateName(config._id,'Cluster')}` ]
                        }
                    }
                ]
            },
           Granularity:"MONTHLY",
           Metrics: [ "UnblendedCost" ],
           TimePeriod: {
               Start: startDate,
               End: endDate
           }
        });

        try {
            this.logger.log(JSON.stringify(command));
            var response = await costExplorerClient.send(command) as GetCostAndUsageCommandOutput;
            this.logger.log(JSON.stringify(response));
            this.logger.log("AWS Costs: " + response.ResultsByTime[0].Total.UnblendedCost.Amount);
            var costs = Number(response.ResultsByTime[0].Total.UnblendedCost.Amount);
            if (costs && costs == 0) {
                return null;
            }
            return costs;
        } catch (error) {
            this.logger.log(error);
            return null;
        }
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
                    Values: [ "on_demand" ]
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
