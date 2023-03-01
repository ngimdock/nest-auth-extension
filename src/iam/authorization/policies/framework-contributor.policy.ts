import { ActiveUserData } from 'src/iam/interfaces';
import { PolicyHandler } from './interfaces/policy-handler.interface';
import { Policy } from './interfaces/policy.interface';
import { PolicyHandlerStorage } from './policy-handlers.storage';

export class FrameworkContributorPolicy implements Policy {
  name: 'frameworkContributor';
}

export class FrameworkContributorPolicyHandler
  implements PolicyHandler<FrameworkContributorPolicy>
{
  constructor(private readonly policyHandlerStorage: PolicyHandlerStorage) {
    this.policyHandlerStorage.add(FrameworkContributorPolicy, this);
  }

  async handler(
    policy: FrameworkContributorPolicy,
    user: ActiveUserData,
  ): Promise<void> {
    const isContributor = user.email.endsWith('@nestjs.com');

    if (!isContributor) throw new Error('User is not a framework contributor.');
  }
}
