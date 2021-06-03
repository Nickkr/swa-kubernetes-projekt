import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';

export type AwsCloudConfigDocument = AwsCloudConfig & Document;

@Schema()
export class AwsCloudConfig {
    provider: string;
    status: TestJobStatus
    testResult: number;
    @Prop()
    test: string;
}

export const AwsCloudConfigSchema = SchemaFactory.createForClass(AwsCloudConfig);
