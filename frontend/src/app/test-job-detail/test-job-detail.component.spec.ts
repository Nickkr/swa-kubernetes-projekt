import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestJobDetailComponent } from './test-job-detail.component';

describe('TestJobDetailComponent', () => {
  let component: TestJobDetailComponent;
  let fixture: ComponentFixture<TestJobDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestJobDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestJobDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
