import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CloudPlatformType } from 'src/models/CloudPlatformTypes';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';

@Schema({ discriminatorKey: 'provider' })
export class CloudConfig {
  @Prop({
    type: String,
    required: true,
    enum: ['aws', 'azure'] as CloudPlatformType[],
  })
  provider: string;
  @Prop({type: TestJobStatus})
  status: TestJobStatus;
  @Prop({default: null})
  testResult: number;
}

export const CloudConfigSchema = SchemaFactory.createForClass(CloudConfig);