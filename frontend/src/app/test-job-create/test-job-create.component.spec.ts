import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestJobCreateComponent } from './test-job-create.component';

describe('TestJobCreateComponent', () => {
  let component: TestJobCreateComponent;
  let fixture: ComponentFixture<TestJobCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TestJobCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestJobCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
