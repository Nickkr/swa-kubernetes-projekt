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
  displayedColumns: string[] = ['name', 'status', 'time', 'action'];
  dataSource: TestJob[] = [];
  testJobStatus: typeof TestJobStatus = TestJobStatus;


  constructor(public testsService: TestsService, private router: Router) {}

  ngOnInit(): void {
    this.testsService.getAllTests().subscribe((tests) => {
      this.dataSource = tests;
    });
  }

  public get TestJobStatus() {
    return TestJobStatus;
  }

  onRowClicked(id: string) {
    this.router.navigate(['testjobs', id]);
  }

  onCancel(event: MouseEvent) {
    event.stopPropagation();
    console.log('Job canceled');
  }

  onDelete(event: MouseEvent) {
    event.stopPropagation();
    console.log('Job deleted');
  }

  onUndeploy(provider: string, id: string, event: MouseEvent) {
    event.stopPropagation();
    this.testsService.undeployTest(provider, id).subscribe(() => {
      console.log("undeployed");
    })
  }
}
