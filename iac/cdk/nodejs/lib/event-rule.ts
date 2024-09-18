import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export class EventConstruct extends Construct {
  public eventRule: Rule;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.eventRule = new Rule(this, 'yearlyRule', {
      schedule: Schedule.cron({ month: '10', day: '1' }),
    });
  }
}
