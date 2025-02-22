import {
  Component,
  Inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule,
} from '@angular/forms';
import { environment } from '../../../environments/environment';
import { DiscordNotification } from '../../gateway/discord-notify.service';
import { AngularNotification } from '../../gateway/dev/angular-notify.service';
import {
  NOTIFICATION_TOKEN,
  NotificationInterface,
} from '../port/notification.interface';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'add-website-pattern',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
  ],
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
export class AddWebsitePatternComponent implements OnInit, AfterViewInit {
  websiteForm!: FormGroup;
  successMessage: boolean = false;
  availableWebsites: string[] = [
    'toonily.com',
    'asuracomic.net',
    'manhuatop.org',
    'arvencomics.com',
    'vortexscans.org',
    'manhuaus.com',
    'manhuafast.net',
    'comick.io',
    'reaper-scan.net',
    'en-thunderscans.com',
    'dragontea.ink',
    'toongod.org',
    'mangadex.org',
    'chapmanganato.to',
    'chapmanganelo.com',
    'scantrad-union.com',
    'manta.net',
    'webtoons.com',
    'tappytoon.com',
    'mangapanda.in',
    'toomics.com',
    'comics.inkr.com',
    'pocketcomics.com',
    'bato.to',
    'mangapark',
    'manhuaplus.com',
    'raijinscan',
    'mangaplus.shueisha.co.jp',
    'mangainn.org',
    'mangadistrict.com',
    'manhuaplus.org',
    'manhwahub.net',
    '1st-kissmanga',
    'templetoons.com',
    'mangafire.to',
  ];
  displayedColumns: string[] = ['website'];
  dataSource = new MatTableDataSource<string>(this.availableWebsites);
  pageSize: number = 5;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    @Inject(NOTIFICATION_TOKEN) private notification: NotificationInterface
  ) {}

  ngOnInit(): void {
    this.websiteForm = this.fb.group({
      website: ['', Validators.required],
    });
    this.dataSource.filterPredicate = (data: string, filter: string) =>
      data.toLowerCase().includes(filter);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  proposeNewWebsite() {
    if (this.websiteForm.valid) {
      this.successMessage = true;
      this.notification.notify(this.websiteForm.value.website);
      this.websiteForm.reset();

      setTimeout(() => {
        this.successMessage = false;
      }, 3000);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
