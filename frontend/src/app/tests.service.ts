import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TestJob } from './models/TestJob.interface';
import { TestJobStatus } from './models/TestJobStatus.enum';

@Injectable({
  providedIn: 'root'
})
export class TestsService {

  private tests$: Observable<TestJob[]>;

  constructor(private http: HttpClient) {
    this.tests$ = timer(1, 3000).pipe(switchMap(() => this.getTests()));
  }

  public getAllTests(): Observable<TestJob[]> {
    return this.tests$;
  }

  private getTests(): Observable<TestJob[]> {
    return this.http.get<TestJob[]>('http://localhost:3000/tests');
  }

  public startTestRun(newTestJob: any): Observable<any> {
    return this.http.post('http://localhost:3000/tests', newTestJob);
  }

  public undeployTest(provider: string, id: string) {
    return this.http.post('http://localhost:3000/tests/' + id + '/undeploy', null, {
      params: {
        provider
      }
    })
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
