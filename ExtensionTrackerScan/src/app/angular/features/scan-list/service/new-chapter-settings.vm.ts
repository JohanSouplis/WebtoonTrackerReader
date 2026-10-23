import {
  CheckFrequency,
  DEFAULT_WATCH_SETTINGS,
} from '../../../../core/domain/chapter-watch';

export type NewChapterSettings = {
  readonly checkEvery: CheckFrequency;
  readonly areNotificationsOn: boolean;
};

export const DEFAULT_NEW_CHAPTER_SETTINGS: NewChapterSettings = {
  ...DEFAULT_WATCH_SETTINGS,
  areNotificationsOn: false,
};
