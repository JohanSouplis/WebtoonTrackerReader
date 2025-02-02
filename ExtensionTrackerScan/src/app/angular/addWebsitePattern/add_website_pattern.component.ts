import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'add-website-pattern',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './add_website_pattern.component.html',
})
export class AddWebsitePatternComponent {
  websiteForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.websiteForm = this.fb.group({
      website: ['', Validators.required],
      url: ['', [Validators.required, Validators.pattern('https?://.+')]],
      pattern: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.websiteForm.valid) {
      console.log('Form Submitted:', this.websiteForm.value);
    } else {
      console.log('Form Invalid');
    }
  }
}
