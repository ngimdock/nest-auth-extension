import { ActiveUserData } from 'src/iam/interfaces';
import { Policy } from './policy.interface';

export interface PolicyHandler<T extends Policy> {
  handler: (policy: T, user: ActiveUserData) => Promise<void>;
}
