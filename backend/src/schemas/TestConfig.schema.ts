import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { TestMode } from 'src/models/TestMode.enum';

export type TestConfigDocument = TestConfig & Document;

@Schema()
export class TestConfig {
    @Prop({type: TestMode})
    testMode: TestMode;
    @Prop()
    coreCount: number;
    @Prop()
    cpuLoadFactor: number;
    @Prop()
    frequency: number;
    @Prop()
    testDuration: number;
    @Prop()
    imageUrl: string;
    @Prop({default: 1,type:Number})
    nodeCount:number;
}

export const TestConfigSchema = SchemaFactory.createForClass(TestConfig);
