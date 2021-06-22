import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Model } from 'mongoose';
import { AwsService } from './aws.service';
import { AzureService } from 'src/_services/azure.service';
import { KubernetesService } from 'src/_services/kubernetes.service';
import { CloudPlatformDeploymentService } from 'src/models/CloudPlatformDeploymentService.interface';
import { CloudPlatformType } from 'src/models/CloudPlatformTypes';
import { TestJobStatus } from 'src/models/TestJobStatus.enum';
import { AwsCloudConfig } from 'src/schemas/AwsCloudConfig.schema';
import { AzureCloudConfig } from 'src/schemas/AzureCloudConfig.schema';
import { TestJob, TestJobDocument } from 'src/schemas/TestJob.schema';
import { CloudConfig } from 'src/schemas/CloudConfig.schema';

@Injectable()
export class TestJobService {
  private readonly logger = new Logger(TestJobService.name);

  constructor(
    @InjectModel(TestJob.name) private testJobModel: Model<TestJobDocument>,
    private azureService: AzureService,
    private awsService: AwsService,
    private kubernetesService: KubernetesService
  ) { }

  async startTestJob(testJob: TestJobDocument) {
    testJob.status = TestJobStatus.RUNNING;
    
    testJob.cloudConfig.forEach( (config) => {
      config.status = TestJobStatus.DEPLOYING;
    });
    await testJob.save();
    await Promise.all(
      testJob.cloudConfig
        .map(async (config,index) => {
          try {
            this.logger.log(testJob);
            const cloudService = this.getCloudService(config.provider);
            const kubeConfig = await cloudService.createCluster(config);
            testJob.cloudConfig[index].kubernetesConfig = kubeConfig;
            await testJob.save();
            const kubeResponse = await this.kubernetesService.deployToCluster(
              kubeConfig,
              config,
              testJob.testConfig
            );
            testJob.cloudConfig[index].status = TestJobStatus.RUNNING;
            testJob.cloudConfig[index].startDeploy = Date.now();
            await testJob.save();
            this.logger.log('-------- Deployed -------');
            this.logger.log(kubeResponse);
          } catch (error) {
            this.logger.log(error);
            testJob.cloudConfig[index].errorMsg = error;
            testJob.cloudConfig[index].status = TestJobStatus.ERROR;
            testJob.status = TestJobStatus.ERROR;
            await testJob.save();
          }
        })
    );
  }

  getCloudService(provider: string): CloudPlatformDeploymentService {
    switch (provider) {
      case 'azure':
        return this.azureService;
      case 'aws':
        return this.awsService;
    }
  }

  async undeployTestJob(testJob: TestJobDocument, provider: string) {
    const index = testJob.cloudConfig.findIndex(config => config.provider == provider);
    const cloudService = this.getCloudService(provider);
    testJob.cloudConfig[index].endDeploy = Date.now();
    testJob.cloudConfig[index].status = TestJobStatus.UNDEPLOYING;
    await testJob.save();
    await cloudService.removeCluster(testJob.cloudConfig[index]);
    testJob.cloudConfig[index].status = TestJobStatus.WAITING_FOR_COST;
    await testJob.save();
  }

  @Cron('5 * * * * *')
  async pollCosts() {
    const jobs = await this.testJobModel
      .find({ "cloudConfig.status": TestJobStatus.WAITING_FOR_COST  })
      .exec();
    if (jobs.length > 0) {
      this.logger.debug('Polling Costs...');
      jobs.map(async (job) => {
        await Promise.all(job.cloudConfig.map(async (config, index) => {
          if (config.status === TestJobStatus.WAITING_FOR_COST) {
            const cloudService = this.getCloudService(config.provider);
            const cost = await cloudService.getCost(config);
            this.logger.log(cost);
            if (cost) {
              job.cloudConfig[index].status = TestJobStatus.FINISHED;
              job.cloudConfig[index].testResult = cost;
              await job.save();
            }

            if (job.cloudConfig.filter(
              (config) => config.status === TestJobStatus.FINISHED
            ).length === job.cloudConfig.length
            ) {
              job.status = TestJobStatus.FINISHED;
              await job.save();
            }
          }
        }));
      });
    }
  }
}
