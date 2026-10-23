import { NewChapter } from '../domain/chapter-watch';
import { ChromeNewChapterAlerts } from './chrome-new-chapter-alerts.gateway';
import { installChrome } from './fake-chrome.fixture';

describe('ChromeNewChapterAlerts', () => {
  it('should show the count of new chapters on the toolbar icon, and nothing for none', async () => {
    const { badges } = useChrome({ isNotificationAllowed: false });
    const alerts = new ChromeNewChapterAlerts();

    await alerts.showCount(3);
    await alerts.showCount(0);

    expect(badges).toEqual(['3', '']);
  });

  it('should not notify without the notifications permission', async () => {
    const { notifications } = useChrome({ isNotificationAllowed: false });

    await new ChromeNewChapterAlerts().announce([SOLO_LEVELING]);

    expect(notifications).toEqual([]);
  });

  it('should notify one new chapter under its address, to open it on click', async () => {
    const { notifications } = useChrome({ isNotificationAllowed: true });

    await new ChromeNewChapterAlerts().announce([SOLO_LEVELING]);

    expect(notifications).toEqual([
      {
        id: SOLO_LEVELING.url,
        options: {
          type: 'basic',
          iconUrl: 'public/icone.png',
          title: 'Solo Leveling',
          message: 'Chapter 201 is out',
        },
      },
    ]);
  });

  it('should group several new chapters in one notification that opens the library', async () => {
    const { notifications } = useChrome({ isNotificationAllowed: true });

    await new ChromeNewChapterAlerts().announce([
      SOLO_LEVELING,
      { title: 'Nano Machine', chapter: 52, url: 'https://scans.org/nano/52' },
    ]);

    expect(notifications).toEqual([
      {
        id: 'new-chapters',
        options: {
          type: 'basic',
          iconUrl: 'public/icone.png',
          title: '2 new chapters',
          message: 'Solo Leveling: chapter 201\nNano Machine: chapter 52',
        },
      },
    ]);
  });
});

const SOLO_LEVELING: NewChapter = {
  title: 'Solo Leveling',
  chapter: 201,
  url: 'https://scans.org/solo-leveling/201',
};

const useChrome = ({
  isNotificationAllowed,
}: {
  isNotificationAllowed: boolean;
}) => {
  const badges: string[] = [];
  const notifications: { id: string; options: object }[] = [];
  installChrome({
    action: {
      setBadgeText: async ({ text }: { text: string }) => {
        badges.push(text);
      },
      setBadgeBackgroundColor: async () => undefined,
    },
    permissions: { contains: async () => isNotificationAllowed },
    notifications: {
      create: async (id: string, options: object) => {
        notifications.push({ id, options });
        return id;
      },
    },
  });
  return { badges, notifications };
};
