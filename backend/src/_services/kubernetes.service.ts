import { AppsV1Api, CoreV1Api, KubeConfig, loadYaml, V1Deployment } from '@kubernetes/client-node';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class KubernetesService {

    private readonly logger = new Logger(KubernetesService.name);

    constructor() {}

    /**
     * Deploys the Test-App to the Cluster specified in the config.
     * 
     * @param config The kubernetes configuration string.
     */
    public async deployToCluster(config: string, cloudConfig: any) {
        this.logger.log('-------- Deploying TestApp to Kubernetes-Cluster -------');
        const kubeConfig = new KubeConfig();
        kubeConfig.loadFromString(config);
        const appsClient = kubeConfig.makeApiClient(AppsV1Api);
        try {
            //const yaml = fs.readFileSync(__dirname + '/deployment.yaml', 'utf-8');
           // const resp = await appsClient.createNamespacedDeployment('default', loadYaml(yaml));
            const resp = await appsClient.createNamespacedDeployment('default', this.getDeploymentConfig(cloudConfig));
        } catch(error) {
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
        const del = await appsClient.deleteNamespacedDeployment('app-demo', 'default');
        return del;
    }

    /**
     * Configuration of the Test-App (deployment.yaml)
     * 
     * @returns {V1Deployment} The deployment configurtation.
     */
    private getDeploymentConfig(config: any): V1Deployment {
        return {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: 'app-demo',
                namespace: 'default'
            },
            spec: {
                replicas: 1,
                selector: {
                    matchLabels: {
                        python: 'app'
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            python: 'app'
                        }
                    },
                    spec: {
                        containers: [
                            {
                                name: 'python-demo',
                                image: 'fabianburth/python-docker:latest',
                            }
                        ]
                    }
                }
            }
        }
    }
}
