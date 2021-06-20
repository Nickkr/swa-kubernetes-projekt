import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';

import { randomUUID } from 'crypto';

export type AzureCloudConfigDocument = AzureCloudConfig & Document;

@Schema()
export class AzureCloudConfig {
    provider: string;
    status: TestJobStatus;
    testResult: number;
    nodeCount: number;
    
    @Prop({ default: randomUUID() })
    resourceGroupName: string;
    @Prop({ default: 'hska-lab-sose2021-kubernetes-TestCluster' })
    clusterName: string;
    
    @Prop()
    tenantId: string;
    @Prop()
    subscriptionId: string;
    @Prop({default: 'germanywestcentral'})
    location: string;
}

export const AzureCloudConfigSchema = SchemaFactory.createForClass(AzureCloudConfig);
