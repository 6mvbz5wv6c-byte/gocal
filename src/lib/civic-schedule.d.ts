import type {CalEvent} from './events';
export function officialVotingUrl(value?:string):boolean;
export function centralClock(now?:Date):{date:string;time:string};
export function civicStatus(event:CalEvent,now?:Date):string;
export function sessionIssues(event:Partial<CalEvent>):{field:string;code:string;message:string}[];
export function civicIssues(event:Partial<CalEvent>):{field:string;code:string;message:string}[];
