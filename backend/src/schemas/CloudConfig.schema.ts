import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { CloudPlatformType } from 'src/models/CloudPlatformTypes';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';

@Schema({ discriminatorKey: 'provider' })
export class CloudConfig {
  @Prop({
    type: String,
    required: true,
    enum: ['aws', 'azure'] as CloudPlatformType[]
  })
  provider: string;
  @Prop({ type: TestJobStatus })
  status: TestJobStatus;
  @Prop({ default: null })
  testResult: number;
  @Prop({ default: randomUUID() })
  resourceGroupName: string;
  @Prop({ default: 'hska-lab-sose2021-kubernetes-TestCluster' })
  clusterName: string;
  @Prop({ default: 1, type: Number })
  nodeCount: number;
}

export const CloudConfigSchema = SchemaFactory.createForClass(CloudConfig);
