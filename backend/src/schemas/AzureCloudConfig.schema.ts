import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { Document } from 'mongoose';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';

export type AzureCloudConfigDocument = AzureCloudConfig & Document;

@Schema()
export class AzureCloudConfig {
    provider: string;
    status: TestJobStatus;
    testResult: number;
    @Prop()
    tenantId: string;
    @Prop()
    subscriptionId: string;
    @Prop({default: 'germanywestcentral'})
    location: string;
    @Prop({default: randomUUID()})
    ressourceGroupName: string;
    @Prop({default: 'TestCluster'})
    clusterName: string;
}

export const AzureCloudConfigSchema = SchemaFactory.createForClass(AzureCloudConfig);
