import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TestJob } from '../models/TestJob.interface';
import { TestJobStatus } from '../models/TestJobStatus.enum';
import { TestsService } from '../tests.service';

@Component({
  selector: 'app-test-job-list',
  templateUrl: './test-job-list.component.html',
  styleUrls: ['./test-job-list.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class TestJobListComponent implements OnInit {
  displayedColumns: string[] = ['expansionStatus','name', 'status', 'time', 'action'];
  dataSource: TestJob[] = [];
  testJobStatus: typeof TestJobStatus = TestJobStatus;
  expandedJob: TestJob | null = null;

  constructor(public testsService: TestsService, private router: Router) {}

  ngOnInit(): void {
    timer(1, 7000).pipe(switchMap(() => this.testsService.getTests())).subscribe(tests => {
      this.dataSource = tests;
    })

   // this.testsService.getTests().subscribe();
  }

  public get TestJobStatus() {
    return TestJobStatus;
  }

  getDuration(testJob: TestJob) {
    return Date.now() - new Date(testJob.time).getTime();
  }

  onRowClicked(id: string) {
    this.router.navigate(['testjobs', id]);
  }


  onDelete(id: string, event: MouseEvent) {
    event.stopPropagation();
    if(id === this.expandedJob?._id) {
      this.expandedJob = null;
    }
    this.testsService.deleteTest(id).subscribe();
    this.testsService.getTests().subscribe();
  }

  onUndeploy(provider: string, id: string, event: MouseEvent) {
    event.stopPropagation();
    this.testsService.undeployTest(provider, id).subscribe(() => {
      console.log("undeployed");
    })
  }
}
