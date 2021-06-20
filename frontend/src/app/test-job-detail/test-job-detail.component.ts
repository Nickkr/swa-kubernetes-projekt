import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AwsCloudConfig, AzureCloudConfig, TestJob } from '../models/TestJob.interface';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';
import { TestsService } from '../tests.service';

@Component({
  selector: 'app-test-job-detail',
  templateUrl: './test-job-detail.component.html',
  styleUrls: ['./test-job-detail.component.scss']
})
export class TestJobDetailComponent implements OnInit {
  private testJobId: number;
  public testJob!: TestJob;

  public barChartOptions: ChartOptions = {
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            beginAtZero: true
          }
        }
      ]
    }
  };
  public barChartLabels: Label[] = ['aws', 'azure'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = true;
  public barChartPlugins = [];

  public barChartData: ChartDataSets[] = [
    { data: [20, 30], label: 'Cost in EUR', backgroundColor: ['#ff9900', '#007fff'] }
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private http: HttpClient,
    public testService: TestsService
  ) {
    this.testJobId = this.activatedRoute.snapshot.params.id;
    this.http
      .get<TestJob>('http://localhost:3000/tests/' + this.testJobId)
      .subscribe((job) => {
        this.testJob = job;
      });
  }

  ngOnInit(): void {}


  getAzureConfig(): AzureCloudConfig {
    return this.testJob.cloudConfig.find((config) => config.provider === 'azure') as AzureCloudConfig;
  }

  getAwsConfig(): AwsCloudConfig {
    return this.testJob.cloudConfig.find((config) => config.provider === 'azure') as AwsCloudConfig;
  }
}
