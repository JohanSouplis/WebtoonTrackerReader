import { FullPageNavigatorPort } from '../service/full-page-navigator.port';

export class InMemoryFullPageNavigator implements FullPageNavigatorPort {
  openFullPage(): void {
    console.log('open page mocked !');
  }
}
