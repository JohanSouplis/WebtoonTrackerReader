export interface WebsiteProposalPort {
  propose(chapterUrl: string): Promise<void>;
}
