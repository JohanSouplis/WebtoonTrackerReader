import { CoverCandidate, CoverImage } from '../domain/cover-search';

export interface CoverImagePort {
  download(candidate: CoverCandidate): Promise<CoverImage | undefined>;
}
