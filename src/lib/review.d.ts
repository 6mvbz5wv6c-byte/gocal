export type Issue={field:string;code:string;message:string};
export const fieldLabels:Record<string,string>;
export function reviewIssues(e:Record<string,any>):Issue[];
export function evidenceQuality(e:Record<string,any>,claims?:any[]):number;

export function reviewWarnings(e:Record<string,any>):Issue[];
export const evidenceScoreVersion:string;
