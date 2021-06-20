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
    nodeCount:number;
    _id:string;

    @Prop({ default: 'eu-central-1' })
    location: string;

    @Prop({default: 'hska-lab-sose2021-kubernetes-vpc-1', type:String})
    vpcName:string;
    @Prop({default: 'default', type: String})
    profile:string;
    @Prop({default:'1.19',type:String})
    kubernetesVersion:string;

    @Prop({default: 'EnBWContributorRole'})
    defaultRole: string;

    // Nodegroup:
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-eks/interfaces/createnodegroupcommandinput.html
    @Prop({default:'AL2_x86_64',type:String})
    amiType:string;
    @Prop({default: 20, type: Number})
    diskSize:number;
    @Prop({default: 'ON_DEMAND', type:String})
    capacityType:string;
    @Prop({default: 't3.medium',type:String})
    instanceType:string;
}

export const AwsCloudConfigSchema = SchemaFactory.createForClass(AwsCloudConfig);
