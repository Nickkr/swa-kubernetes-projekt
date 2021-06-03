import { Body, Controller, Delete, Get, Param, Post, Render } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TestJob, TestJobDocument } from './schemas/TestJob.schema';
import { TestJobService } from './_services/test-job.service';

@Controller()
export class AppController {
  constructor(@InjectModel(TestJob.name) private testJobModel: Model<TestJobDocument>, private testJobService: TestJobService) {}
  
  @Get('/tests')
  public async getAllTestJobs() {
    const jobs = await this.testJobModel.find().exec();
    return jobs;
  }

  @Get('/tests/:id')
  public async getTestJobById(@Param('id') id: string) {
    const job = await this.testJobModel.findById(id).exec();
    return job;
  }

  @Delete('/tests')
  public async deleteAllTestJobs() {
    await this.testJobModel.deleteMany();
  }

  @Post('/tests')
  public async createTestJob(@Body() testJob: TestJob) {
    const newJob = new this.testJobModel(testJob);
    const job = await newJob.save();
    this.testJobService.startTestJob(newJob);
    return job;
  }
}
