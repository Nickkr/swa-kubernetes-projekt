import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TestJob } from '../models/TestJob.interface';
import { TestJobStatus } from '../models/TestJobStatus.enum';
import { TestsService } from '../tests.service';

@Component({
  selector: 'app-test-job-list',
  templateUrl: './test-job-list.component.html',
  styleUrls: ['./test-job-list.component.scss']
})
export class TestJobListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'status', 'time'];
  dataSource: TestJob[] = [];

  constructor(private testsService: TestsService, private router: Router) {}

  ngOnInit(): void {
    this.testsService.getAllTests().subscribe((tests) => {
      this.dataSource = tests;
    });
  }

  onRowClicked(id: string) {
    this.router.navigate(['testjobs', id]);
  }

  getStatusIcon(status: TestJobStatus): { text: string; iconName: string } {
    let iconName = '';
    let text = '';
    switch (status) {
      case TestJobStatus.DEPLOYING:
        iconName = 'cloud_upload';
        text = 'Deploying to Cloud';
        break;
      case TestJobStatus.RUNNING:
        iconName = 'sync';
        text = 'Test is running';
        break;
      case TestJobStatus.UNDEPLOYING:
        iconName = 'cloud_download';
        text = 'Undeploying from Cloud';
        break;
      case TestJobStatus.WAITING_FOR_COST:
        iconName = 'hourglass_empty';
        text = 'Waiting for costs';
        break;
      case TestJobStatus.FINISHED:
        iconName = 'check_circle';
        text = 'Finished';
        break;
      case TestJobStatus.ERROR:
        iconName = 'error';
        break;
    }
    return { text, iconName };
  }
}
