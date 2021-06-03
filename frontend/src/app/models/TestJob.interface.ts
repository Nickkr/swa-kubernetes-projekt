export interface AwsCloudConfig {
  provider: string;
  _id: string;
}

export interface AzureCloudConfig {
  provider: string;
  _id: string;
  subscriptionId: string;
  tenantId: string;
  location: string;
  ressourceGroupName: string;
  clusterName: string;
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
}
