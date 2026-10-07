import {Music2,Palette,Users,TreePine,Utensils,BookOpen,CalendarDays,Landmark} from 'lucide-react';

const icons:Record<string,typeof Music2>={music:Music2,arts:Palette,community:Users,outdoors:TreePine,food:Utensils,learning:BookOpen,civics:Landmark};
export function CategoryIcon({category,color,className=''}:{category:string;color?:string;className?:string}){
 const Icon=icons[category]||CalendarDays;
 return <Icon className={'category-icon '+className} style={{color}} size={16} strokeWidth={2.25} aria-hidden="true"/>;
}
