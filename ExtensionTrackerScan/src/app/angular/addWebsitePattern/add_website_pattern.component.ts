import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { environment } from '../../../environments/environment';
import { DiscordNotification } from '../../gateway/discord-notify.service';
import { AngularNotification } from '../../gateway/dev/angular-notify.service';
import {
  NOTIFICATION_TOKEN,
  NotificationInterface,
} from '../port/notification.interface';

@Component({
  selector: 'add-website-pattern',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './add_website_pattern.component.html',
  styleUrls: ['./add_website_pattern.component.css'],
  providers: [
    {
      provide: NOTIFICATION_TOKEN,
      useClass: environment.production
        ? DiscordNotification
        : AngularNotification,
    },
  ],
})
export class AddWebsitePatternComponent implements OnInit {
  websiteForm!: FormGroup;
  successMessage: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(NOTIFICATION_TOKEN)
    private notification: NotificationInterface
  ) {}
  ngOnInit(): void {
    this.websiteForm = this.fb.group({
      website: ['', Validators.required],
    });
  }

  proposeNewWebsite() {
    if (this.websiteForm.valid) {
      this.successMessage = true;
      this.websiteForm.reset();
      this.notification.notify(this.websiteForm.value.website);
      setTimeout(() => {
        this.successMessage = false;
      }, 3000);
    }
  }
}
