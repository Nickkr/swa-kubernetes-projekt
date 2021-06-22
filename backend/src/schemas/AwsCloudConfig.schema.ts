import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';

export type AwsCloudConfigDocument = AwsCloudConfig & Document;

const defaultInstanceType:string[] = [];

@Schema()
export class AwsCloudConfig {
    provider: string;
    status: TestJobStatus
    testResult: number;
    _id:string;

    @Prop({ default: 'eu-central-1' })
    location: string;
    @Prop({default: 'default', type: String})
    profile:string;
    @Prop({default: 80, type: Number})
    diskSize:number;
    @Prop({default: 't3.medium',type:String})
    instanceType:string;
    @Prop({default: 'swatest', type:String})
    tagName:string;

    startDeploy:number;
    endDeploy:number;
    
}

export const AwsCloudConfigSchema = SchemaFactory.createForClass(AwsCloudConfig);
