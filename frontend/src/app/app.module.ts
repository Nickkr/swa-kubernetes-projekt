import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CdkTableModule } from '@angular/cdk/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { TestJobDetailComponent } from './test-job-detail/test-job-detail.component';
import { TestJobListComponent } from './test-job-list/test-job-list.component';
import { TestJobCreateComponent } from './test-job-create/test-job-create.component';
import { ChartsModule } from 'ng2-charts';

@NgModule({
  declarations: [AppComponent, TestJobDetailComponent, TestJobListComponent, TestJobCreateComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CdkTableModule,
    NoopAnimationsModule,
    MatButtonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    ChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
