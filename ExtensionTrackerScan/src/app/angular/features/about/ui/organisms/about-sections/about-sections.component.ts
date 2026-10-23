import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-about-sections',
  imports: [MatIconModule, MatSlideToggleModule],
  templateUrl: './about-sections.component.html',
  styleUrl: './about-sections.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSectionsComponent {
  readonly version = input.required<string>();
  readonly sendsParseReports = input.required<boolean>();
  readonly parseReportsToggled = output<boolean>();
  protected readonly issuesUrl =
    'https://github.com/JohanSouplis/WebtoonTrackerReader/issues';
}
