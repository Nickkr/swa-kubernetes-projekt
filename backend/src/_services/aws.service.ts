import { Injectable } from '@nestjs/common';
import { CloudPlatformDeploymentService } from 'src/models/CloudPlatformDeploymentService.interface';
import { AwsCloudConfig } from 'src/schemas/AwsCloudConfig.schema';
import { EKS, SharedIniFileCredentials } from 'aws-sdk';

@Injectable()
export class AwsService implements CloudPlatformDeploymentService {

    async login(config: AwsCloudConfig) {
        const creds = new SharedIniFileCredentials({
            
        })
    }
    async createCluster(config: AwsCloudConfig): Promise<string> {
        const eks = new EKS({

        });
        eks.createCluster();
        return await 'awd';
    }

    async removeCluster(config: AwsCloudConfig) {
        
    }

    async getCost(): Promise<number> {
        return await 0;
    }
}
