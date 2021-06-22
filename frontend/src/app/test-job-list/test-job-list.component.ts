import { animate, state, style, transition, trigger } from '@angular/animations';
import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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

  private poll$: Subscription | null = null;

  constructor(public testsService: TestsService, private router: Router, private changeRef: ChangeDetectorRef, private datepipe: DatePipe) {}

  ngOnInit(): void {
    this.poll$ = this.testsService.pollTests().subscribe((jobs) => {
      this.dataSource = jobs;
      this.changeRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if(this.poll$) {
      this.poll$.unsubscribe();
    }
  }

  /**
   * Returns the TestJobStatus enum to be used inside the template.
   * @returns {TestJobStatus} The TestJobStatusEnum.
   */
  public get TestJobStatus() {
    return TestJobStatus;
  }

  /**
   * Returns the duration the test is running.
   *
   * @param cloudConfig The cloudConfin
   * @returns {string} The duration the test is running (Format HH:mm:ss)
   */
  getDuration(cloudConfig: CloudConfig): string | null {
    if(!cloudConfig.startDeploy) {
      return "-";
    }
    if(cloudConfig.startDeploy != null && cloudConfig.endDeploy == null) {
      return this.datepipe.transform(Date.now() - cloudConfig.startDeploy, 'HH:mm:ss','+0000');
    }
    return this.datepipe.transform(cloudConfig.endDeploy - cloudConfig.startDeploy, 'HH:mm:ss','+0000');
  }

  /**
   * Handler for clicking on a row.
   *
   * @param {string} id The id of a testJob.
   */
  onRowClicked(id: string) {
    this.router.navigate(['testjobs', id]);
  }


  /**
   * Handles the deletion of a TestJob.
   *
   * @param {string} id The id of a testJob.
   * @param {MouseEvent} event The click event on the delete button.
   */
  onDelete(id: string, event: MouseEvent) {
    event.stopPropagation();
    if(id === this.expandedJob?._id) {
      this.expandedJob = null;
    }
    this.testsService.deleteTest(id).subscribe(() => {
      this.testsService.getTests().subscribe();
    });
  }

  /**
   * Handles the undeployment of a cloudConfig.
   *
   * @param {string} provider The name of the cloud provider.
   * @param {string} id The id of the testJob.
   * @param {MouseEvent} event  The click event on the undeploy button.
   */
  onUndeploy(provider: string, id: string, event: MouseEvent) {
    event.stopPropagation();
    this.testsService.undeployTest(provider, id).subscribe(() => {
      console.log("undeployed");
      this.testsService.getTests().subscribe();
    })
  }
}
