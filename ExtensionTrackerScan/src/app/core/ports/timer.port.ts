export type Spacing = {
  readonly atLeastMs: number;
  readonly jitterMs: number;
};

export interface TimerPort {
  waitAround(spacing: Spacing): Promise<void>;
}
