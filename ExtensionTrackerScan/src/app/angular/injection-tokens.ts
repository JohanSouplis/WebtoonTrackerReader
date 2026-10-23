import { InjectionToken } from '@angular/core';
import { ChapterWatchRepository } from '../core/ports/chapter-watch-repository.port';
import { ClockPort } from '../core/ports/clock.port';
import { CoverRepository } from '../core/ports/cover-repository.port';
import { RatePromptRepository } from '../core/ports/rate-prompt-repository.port';
import { ScanRepository } from '../core/ports/scan-repository.port';
import { WatchSettingsRepository } from '../core/ports/watch-settings-repository.port';
import { CoverBackfillPort } from './features/scan-list/service/cover-backfill.port';
import { NotificationPermissionPort } from './features/scan-list/service/notification-permission.port';
import { FullPageNavigatorPort } from './shell/service/full-page-navigator.port';
import { StoreListingPort } from './shell/service/store-listing.port';

export const FULL_PAGE_NAVIGATOR = new InjectionToken<FullPageNavigatorPort>(
  'FullPageNavigatorPort',
);

export const SCAN_REPOSITORY = new InjectionToken<ScanRepository>(
  'ScanRepository',
);

export const CLOCK = new InjectionToken<ClockPort>('ClockPort');

export const COVER_REPOSITORY = new InjectionToken<CoverRepository>(
  'CoverRepository',
);

export const COVER_BACKFILL = new InjectionToken<CoverBackfillPort>(
  'CoverBackfillPort',
);

export const CHAPTER_WATCH_REPOSITORY =
  new InjectionToken<ChapterWatchRepository>('ChapterWatchRepository');

export const WATCH_SETTINGS_REPOSITORY =
  new InjectionToken<WatchSettingsRepository>('WatchSettingsRepository');

export const NOTIFICATION_PERMISSION =
  new InjectionToken<NotificationPermissionPort>('NotificationPermissionPort');

export const STORE_LISTING = new InjectionToken<StoreListingPort>(
  'StoreListingPort',
);

export const RATE_PROMPT_REPOSITORY = new InjectionToken<RatePromptRepository>(
  'RatePromptRepository',
);
