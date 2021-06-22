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
    resourceGroupName: string;
    clusterName: string;
    nodeCount: number;
    _id:string;

    @Prop()
    subscriptionId: string;
    @Prop({default: 'germanywestcentral'})
    location: string;

    startDeploy:number;
    endDeploy:number;
}

export const AzureCloudConfigSchema = SchemaFactory.createForClass(AzureCloudConfig);
