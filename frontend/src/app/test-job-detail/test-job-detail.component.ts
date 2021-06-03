import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TestJob } from '../models/TestJob.interface';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { Label } from 'ng2-charts';

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
    private http: HttpClient
  ) {
    this.testJobId = this.activatedRoute.snapshot.params.id;
    this.http
      .get<TestJob>('http://localhost:3000/tests/' + this.testJobId)
      .subscribe((job) => {
        this.testJob = job;
      });
  }

  ngOnInit(): void {}
}
