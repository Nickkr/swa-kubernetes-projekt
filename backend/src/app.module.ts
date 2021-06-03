import { HttpModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KubernetesService } from './_services/kubernetes.service';
import { AzureService } from './_services/azure.service';
import { AwsService } from './_services/aws.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TestJob, TestJobSchema} from './schemas/TestJob.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { TestJobService } from './_services/test-job.service';
import { CloudConfig, CloudConfigSchema } from './schemas/CloudConfig.schema';
import { AwsCloudConfigSchema } from './schemas/AwsCloudConfig.schema';
import { AzureCloudConfigSchema } from './schemas/AzureCloudConfig.schema';

@Module({
  imports: [MongooseModule.forRoot('mongodb://root:rootpassword@localhost:27017', {
    dbName: 'nest'
  }), MongooseModule.forFeature([{ name: TestJob.name, schema: TestJobSchema}, {name: CloudConfig.name, schema: CloudConfigSchema, discriminators: [{
    name: 'azure',
    schema: AzureCloudConfigSchema
  },
  {
    name: 'aws',
    schema: AwsCloudConfigSchema
  }
]}]), ScheduleModule.forRoot(), HttpModule
],
  controllers: [AppController],
  providers: [AppService, KubernetesService, AzureService, AwsService, TestJobService],
})
export class AppModule {
}
