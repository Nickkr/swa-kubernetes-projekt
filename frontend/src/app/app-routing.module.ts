import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestJobCreateComponent } from './test-job-create/test-job-create.component';
import { TestJobDetailComponent } from './test-job-detail/test-job-detail.component';
import { TestJobListComponent } from './test-job-list/test-job-list.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/testjobs'
  },
  {
    path: 'testjobs',
    component: TestJobListComponent
  },
  {
    path: 'testjobs/create',
    component: TestJobCreateComponent
  },
  {
    path: 'testjobs/:id',
    component: TestJobDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
