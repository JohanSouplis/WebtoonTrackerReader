export interface CrashReport {
  execute(informations: string, titleWepPage: string, error?: string): void;
}
