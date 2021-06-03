import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CloudPlatformType } from 'src/models/CloudPlatformTypes';

export type TestJobResultDocument = TestJobResult & Document;

@Schema()
export class TestJobResult {
    @Prop()
    provider: string
    @Prop()
    cost: number
}

export const TestJobResultSchema = SchemaFactory.createForClass(TestJobResult);
