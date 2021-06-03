import { Test, TestingModule } from '@nestjs/testing';
import { TestJobService } from './test-job.service';

describe('TestJobService', () => {
  let service: TestJobService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestJobService],
    }).compile();

    service = module.get<TestJobService>(TestJobService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
