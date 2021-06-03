import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { TestJob } from './models/TestJob.interface';

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
}
