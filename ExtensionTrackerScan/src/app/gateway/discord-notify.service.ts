import { Injectable } from '@angular/core';
import { NotificationInterface } from '../angular/port/notification.interface';

@Injectable({
  providedIn: 'root',
})
export class DiscordNotification implements NotificationInterface {
  constructor() {}
  async notify(website: string): Promise<void> {
    const payload = {
      content: `📢 **New website proposed :**\n\`\`\`${website}\`\`\``,
    };

    try {
      const response = await fetch(
        'https://discord.com/api/webhooks/1335709119444811846/vA5rdOv8-CGL9QhgbO95mZUOyToggmpvPjEBSiskvMmfJFn_o0bVODbqjyJ5xBT31Am4',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        console.error('Error when sending to discord', response.statusText);
        throw new Error(`Erreur HTTP : ${response.status}`);
      }
    } catch (error) {
      console.error('Error while sending to discord :', error);
    }
  }
}
