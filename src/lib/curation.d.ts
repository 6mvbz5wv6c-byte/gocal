import type {CalEvent} from './events';
export const curationVersion:string;
export function curateEvent(e:CalEvent,today:string):{lane:'expired'|'civic'|'shortlist'|'routine';reason:string};
export function inCurationView(e:CalEvent,view:string,today:string):boolean;
