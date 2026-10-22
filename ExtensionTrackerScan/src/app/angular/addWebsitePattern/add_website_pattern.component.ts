import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProposeWebsiteUseCase } from '../../core/use-cases/propose-website.use-case';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'add-website-pattern',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './add_website_pattern.component.html',
  styleUrls: ['./add_website_pattern.component.css'],
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
    'kunmanga.com',
  ];
  displayedColumns: string[] = ['website'];
  dataSource = new MatTableDataSource<string>(this.availableWebsites);
  pageSize: number = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private readonly proposeWebsite = inject(ProposeWebsiteUseCase);

  constructor(private fb: FormBuilder) {}

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
      this.proposeWebsite.execute(this.websiteForm.value.website);
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
