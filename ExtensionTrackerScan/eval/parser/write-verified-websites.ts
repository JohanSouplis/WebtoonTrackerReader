import { writeFileSync } from 'fs';
import { VERIFIED_WEBSITES_PATH, verifiedWebsites } from './verified-websites';

const websites = verifiedWebsites();
writeFileSync(VERIFIED_WEBSITES_PATH, `${JSON.stringify(websites, null, 2)}\n`);
console.log(
  `${websites.length} verified websites written to ${VERIFIED_WEBSITES_PATH}`,
);
