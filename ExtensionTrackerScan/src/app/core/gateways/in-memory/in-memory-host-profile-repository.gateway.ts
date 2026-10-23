import { HostProfile, HostProfiles } from '../../domain/chapter-watch';
import { HostProfileRepository } from '../../ports/host-profile-repository.port';

export class InMemoryHostProfileRepository implements HostProfileRepository {
  private readonly profiles: Map<string, HostProfile>;

  constructor(profiles: Readonly<Record<string, HostProfile>> = {}) {
    this.profiles = new Map(Object.entries(profiles));
  }

  async find(sites: readonly string[]): Promise<HostProfiles> {
    return new Map(
      sites.flatMap((site) => {
        const profile = this.profiles.get(site);
        return profile ? [[site, profile]] : [];
      }),
    );
  }

  async update(
    site: string,
    change: (stored: HostProfile | undefined) => HostProfile,
  ): Promise<void> {
    this.profiles.set(site, change(this.profiles.get(site)));
  }
}
