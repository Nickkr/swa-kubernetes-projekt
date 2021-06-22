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
  @Prop({default: null})
  errorMsg: string;
  @Prop({ default: randomUUID })
  resourceGroupName: string;
  @Prop({ default: 'TestCluster' })
  clusterName: string;
  @Prop({default: null})
  startDeploy:number;
  @Prop({default: null})
  endDeploy:number;
  @Prop()
  kubernetesConfig: string
}

export const CloudConfigSchema = SchemaFactory.createForClass(CloudConfig);
