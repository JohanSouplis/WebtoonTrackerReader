import { Spacing, TimerPort } from '../ports/timer.port';

export class SystemTimer implements TimerPort {
  waitAround({ atLeastMs, jitterMs }: Spacing): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, atLeastMs + Math.random() * jitterMs),
    );
  }
}
