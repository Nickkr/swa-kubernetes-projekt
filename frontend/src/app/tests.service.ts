import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { merge, Observable, Subject, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { TestJob, TestModeEnum } from './models/TestJob.interface';
import { TestJobStatus } from './models/TestJobStatus.enum';

@Injectable({
  providedIn: 'root'
})
export class TestsService {

  public tests$: Subject<TestJob[]> = new Subject();

  constructor(private http: HttpClient) {
  }

  public pollTests() {
    return merge(timer(1, 7000).pipe(switchMap(() => this.getTests())), this.tests$);
  }

  public getTests(): Observable<TestJob[]> {
    return this.http.get<TestJob[]>('http://localhost:3000/tests');
  }

  public startTestRun(newTestJob: any): Observable<any> {
    return this.http.post('http://localhost:3000/tests', newTestJob);
  }

  public deleteTest(id: string) {
    return this.http.delete('http://localhost:3000/tests/' + id).pipe(switchMap(() => this.getTests().pipe(tap((jobs) => this.tests$.next(jobs)))));
  }

  public undeployTest(provider: string, id: string) {
    return this.http.post('http://localhost:3000/tests/' + id + '/undeploy', null, {
      params: {
        provider
      }
    }).pipe(switchMap(() => this.getTests().pipe(tap((jobs) => this.tests$.next(jobs)))))
  }

  public getContainerLogs(id: string, provider: string): Observable<{log: string}> {
    return this.http.get<{log: string}>(`http://localhost:3000/tests/${id}/logs`, {
      params: {
        provider
      }
    });
  }
  public getTestModeText(mode: TestModeEnum): string {
    switch(mode) {
      case TestModeEnum.DEFINED_LOAD:
        return 'Defined load';
      case TestModeEnum.DEFINED_DURATION:
        return 'Defined duration';
      case TestModeEnum.CUSTOM:
        return 'Custom test';
    }
  }

  public getStatusIcon(status: TestJobStatus): { text: string; iconName: string } {
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
        text= "Error occured"
        break;
    }
    return { text, iconName };
  }
}
