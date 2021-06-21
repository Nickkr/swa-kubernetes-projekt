import { TestJobStatus } from "./TestJobStatus.enum";

export interface AwsCloudConfig extends CloudConfig {
  provider: string;
  _id: string;
  location: string;
  profile: string;
  kubernetesVersion: string;
  defaultRole: string;
  // Nodegroup:
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-eks/interfaces/createnodegroupcommandinput.html
  amiType: string;
  diskSize: number;
  capacityType: string;
  instanceType: string;
}

export interface AzureCloudConfig extends CloudConfig {
  provider: string;
  _id: string;
  subscriptionId: string;
  tenantId: string;
  location: string;
  clusterName: string;
}

export interface CloudConfig {
  errorMsg: string
  status: TestJobStatus
  resourceGroupName: string;
  testResult: number;
}

export interface TestConfig {
  _id: string;
}

export interface TestJob {
  _id: string;
  name: string;
  cloudConfig: (AzureCloudConfig | AwsCloudConfig)[];
  testConfig: TestConfig;
  results: any[];
  __v: number;
  status: number;
  time: Date;
}
