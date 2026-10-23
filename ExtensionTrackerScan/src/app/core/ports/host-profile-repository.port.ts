import { HostProfile, HostProfiles } from '../domain/chapter-watch';

export interface HostProfileRepository {
  find(sites: readonly string[]): Promise<HostProfiles>;
  update(
    site: string,
    change: (stored: HostProfile | undefined) => HostProfile,
  ): Promise<void>;
}
