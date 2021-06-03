import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';
import { AwsCloudConfigSchema } from './AwsCloudConfig.schema';
import { AzureCloudConfigSchema } from './AzureCloudConfig.schema';
import { CloudConfig, CloudConfigSchema } from './CloudConfig.schema';
import { TestConfig, TestConfigSchema } from './TestConfig.schema';
import { TestJobResult, TestJobResultSchema } from './TestJobResult.schema';
import * as mongoose from 'mongoose';

export type TestJobDocument = TestJob & Document;

@Schema()
export class TestJob {
    @Prop()
    name: string;
    @Prop({ type: [CloudConfigSchema] })
    cloudConfig: CloudConfig[];
    @Prop({ type: TestConfigSchema })
    testConfig: TestConfig;
    @Prop({type: TestJobStatus})
    status: TestJobStatus;
    @Prop({default: ''})
    statusText: string; 
    @Prop({type: Date, default: Date.now()})
    time: Date;
}

export const TestJobSchema = SchemaFactory.createForClass(TestJob);

(TestJobSchema.path('cloudConfig') as any).discriminator('azure', AzureCloudConfigSchema);
(TestJobSchema.path('cloudConfig') as any).discriminator('aws', AwsCloudConfigSchema);