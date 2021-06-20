import {
  AppsV1Api,
  CoreV1Api,
  KubeConfig,
  V1Pod
} from '@kubernetes/client-node';
import { Injectable, Logger } from '@nestjs/common';
import { TestConfig } from 'src/schemas/TestConfig.schema';

@Injectable()
export class KubernetesService {
  private readonly logger = new Logger(KubernetesService.name);

  constructor() {}

  /**
   * Deploys the Test-App to the Cluster specified in the config.
   *
   * @param config The kubernetes configuration string.
   */
  public async deployToCluster(config: string, cloudConfig: any, testConfig: TestConfig) {
    this.logger.log('-------- Deploying TestApp to Kubernetes-Cluster -------');
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(config);
    //const appsClient = kubeConfig.makeApiClient(AppsV1Api);
    const coreClient = kubeConfig.makeApiClient(CoreV1Api);
    try {
      //const yaml = fs.readFileSync(__dirname + '/deployment.yaml', 'utf-8');
      // const resp = await appsClient.createNamespacedDeployment('default', loadYaml(yaml));
      //const resp = await appsClient.createNamespacedDeployment('default', this.getDeploymentConfig(cloudConfig));
      const resp = await coreClient.createNamespacedPod(
        'default',
        this.getDeploymentConfig(testConfig)
      );
    } catch (error) {
      this.logger.log(error);
    }
  }

  /**
   * Undeploys the Test-App from the Cluster specified in the config.
   *
   * @param config The kubernetes configuration string.
   * @returns
   */
  public async undeployFromCluster(config: string) {
    this.logger.log('-------- Undeploy Cluster -------');
    const kubeConfig = new KubeConfig();
    kubeConfig.loadFromString(config);
    const appsClient = kubeConfig.makeApiClient(AppsV1Api);
    const del = await appsClient.deleteNamespacedDeployment(
      'app-demo',
      'default'
    );
    return del;
  }

  /**
   * Configuration of the Test-App (deployment.yaml)
   *
   * @returns {V1Pod} The deployment configurtation.
   */
  private getDeploymentConfig(testConfig: TestConfig): V1Pod {
    const imgUrl = testConfig.imageUrl ? testConfig.imageUrl : 'fabianburth/python-configurable:v2.1.1';
    return {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: 'app-demo',
        namespace: 'default'
      },
      spec: {
        restartPolicy: 'Never',
        containers: [
          {
            name: 'python-demo',
            image: imgUrl,
            env: [
              {
                name: 'CPU_LOAD',
                value: testConfig.cpuLoadFactor.toString()
              },
              {
                name: 'FREQUENCY',
                value: testConfig.frequency.toString()
              },
              {
                name: 'CORES',
                value: testConfig.coreCount.toString()
              },
              {
                name: 'TEST_VARIANT',
                value: testConfig.testMode.toString()
              },
              {
                name: 'RUNTIME',
                value: testConfig.testDuration.toString()
              }
            ]
          }
        ]
      }
    };
  }
}
