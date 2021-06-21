import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { TestJob, TestModeEnum } from './models/TestJob.interface';
import { TestJobStatus } from './models/TestJobStatus.enum';

@Injectable({
  providedIn: 'root'
})
export class TestsService {

  private tests$: Subject<TestJob[]> = new Subject();

  constructor(private http: HttpClient) {
  }

  public getTests(): Observable<TestJob[]> {
    return this.http.get<TestJob[]>('http://localhost:3000/tests').pipe(tap((job) => {
      this.tests$.next(job);
    }));
  }

  public startTestRun(newTestJob: any): Observable<any> {
    return this.http.post('http://localhost:3000/tests', newTestJob);
  }

  public deleteTest(id: string) {
    return this.http.delete('http://localhost:3000/tests/' + id);
  }

  public undeployTest(provider: string, id: string) {
    return this.http.post('http://localhost:3000/tests/' + id + '/undeploy', null, {
      params: {
        provider
      }
    })
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
