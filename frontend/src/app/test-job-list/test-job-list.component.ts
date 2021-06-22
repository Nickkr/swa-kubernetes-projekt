import { animate, state, style, transition, trigger } from '@angular/animations';
import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CloudConfig, TestJob } from '../models/TestJob.interface';
import { TestJobStatus } from '../models/TestJobStatus.enum';
import { TestsService } from '../tests.service';

@Component({
  selector: 'app-test-job-list',
  templateUrl: './test-job-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  constructor(public testsService: TestsService, private router: Router, private changeRef: ChangeDetectorRef, private datepipe: DatePipe) {}

  ngOnInit(): void {
    timer(1, 7000).pipe(switchMap(() => this.testsService.getTests())).subscribe(tests => {
      this.dataSource = tests;
      this.changeRef.detectChanges();
    })

   // this.testsService.getTests().subscribe();
  }

  public get TestJobStatus() {
    return TestJobStatus;
  }

  getDuration(cloudConfig: CloudConfig) {
    if(!cloudConfig.startDeploy) {
      return "-";
    }
    if(cloudConfig.startDeploy != null && cloudConfig.endDeploy == null) {
      return this.datepipe.transform(Date.now() - cloudConfig.startDeploy, 'HH:mm:ss','+0000');
    }
    return this.datepipe.transform(cloudConfig.endDeploy - cloudConfig.startDeploy, 'HH:mm:ss','+0000');
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
