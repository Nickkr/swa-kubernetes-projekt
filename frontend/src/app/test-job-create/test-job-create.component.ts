import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TestsService } from '../tests.service';

@Component({
  selector: 'app-test-job-create',
  templateUrl: './test-job-create.component.html',
  styleUrls: ['./test-job-create.component.scss']
})
export class TestJobCreateComponent implements OnInit {
  public testJobForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private testService: TestsService,
    private router: Router
  ) {
    this.testJobForm = this.fb.group({
      name: '',
      testConfig: this.fb.group({
        testMode: '0',
        coreCount: '1',
        cpuLoadFactor: '0.5',
        frequency: '10',
        testDuration: '300',
        imageUrl: '',
        nodeCount: 1
      }),
      cloudConfig: this.fb.array([
        this.fb.group({
          provider: 'azure',
          subscriptionId: '',
          vmSize: 'Standard_DS2_v2',
        }),
        this.fb.group({
          provider: 'aws',
          profile:'',
          instanceType: 't3.medium'
        })
      ])
    });
  }

  ngOnInit(): void {}

  getControl(path: string): FormControl {
    return this.testJobForm.get(path) as FormControl;
  }

  startTestRun(): void {
    console.log(this.testJobForm.valid);
    if (this.testJobForm.valid) {
      const newTestJob = this.testJobForm.getRawValue();
      this.testService.startTestRun(newTestJob).subscribe(() => {
        this.router.navigate(['/']);
      });
    }
  }
}
