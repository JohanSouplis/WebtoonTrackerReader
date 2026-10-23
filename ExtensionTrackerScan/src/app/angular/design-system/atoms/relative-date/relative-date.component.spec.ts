import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { render, screen } from '@testing-library/angular';
import { RelativeDateComponent } from './relative-date.component';

const NOW = new Date('2025-03-10T12:00:00Z');

describe('RelativeDateComponent', () => {
  it.each`
    date                      | ago
    ${'2025-03-10T08:00:00Z'} | ${'today'}
    ${'2025-03-04T12:00:00Z'} | ${'6d ago'}
    ${'2024-12-01T19:15:25Z'} | ${'3 mo ago'}
    ${'2024-01-21T12:30:15Z'} | ${'1.1 yr ago'}
    ${'2023-03-10T12:00:00Z'} | ${'2 yr ago'}
  `('should say $ago when the date is $date', async ({ date, ago }) => {
    await renderDate(new Date(date));

    expect(screen.getByText(ago)).toBeInTheDocument();
  });

  it('should describe the relative date with the exact date in the browser language', async () => {
    const date = new Date('2024-12-01T19:15:25Z');
    await renderDate(date);

    expect(screen.getByText('3 mo ago')).toHaveAccessibleDescription(
      date.toLocaleDateString(navigator.language, { dateStyle: 'medium' }),
    );
  });
});

const renderDate = (date: Date) =>
  render(RelativeDateComponent, {
    inputs: { date, now: NOW },
    providers: [provideNoopAnimations()],
  });
