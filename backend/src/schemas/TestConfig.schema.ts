import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TestConfigDocument = TestConfig & Document;

@Schema()
export class TestConfig {
    @Prop()
    coreCount: number;
    @Prop()
    cpuLoadFactor: number;
    @Prop()
    frequency: number;
    @Prop()
    testDuration: number;
    @Prop({default: 1,type:Number})
    nodeCount:number;
}

export const TestConfigSchema = SchemaFactory.createForClass(TestConfig);
