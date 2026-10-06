import type {CalEvent} from './events';
export function shiftDate(date:string,days:number):string;
export function lastEventDate(e:CalEvent):string;
export function eventOnDate(e:CalEvent,date:string):boolean;
export function eventInMonth(e:CalEvent,month:string,focusDate?:string|null):boolean;
export function eventTimeLabel(e:CalEvent,date?:string):string;
export function eventDateLabel(e:CalEvent):string;
export function eventCalendarFile(e:CalEvent,stamp?:Date):string;
