import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestJobListComponent } from './test-job-list.component';

describe('TestJobListComponent', () => {
  let component: TestJobListComponent;
  let fixture: ComponentFixture<TestJobListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestJobListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestJobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
