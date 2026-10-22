import { ClockPort } from '../../ports/clock.port';

export class FixedClock implements ClockPort {
  constructor(private readonly date = new Date('2025-03-10T12:00:00Z')) {}

  now(): Date {
    return this.date;
  }
}
