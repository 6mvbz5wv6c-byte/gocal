import test from 'node:test';
import assert from 'node:assert/strict';
import {categories} from '../src/lib/categories.js';
const luminance=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('category text meets 4.5:1 on event fills and white agenda rows',()=>{
 for(const c of categories){assert.match(c.bg,/^#[0-9a-f]{6}$/i,'opaque fills required');for(const bg of [c.bg,'#FFFFFF'])assert.ok(contrast(c.color,bg)>=4.5,`${c.id} text contrast on ${bg}: ${contrast(c.color,bg)}`);}
});
test('checkbox checks and category boundaries meet 3:1 non-text contrast',()=>{
 for(const c of categories){assert.ok(contrast(c.onAccent,c.accent)>=3,`${c.id} check contrast`);assert.ok(contrast(c.color,c.bg)>=3,`${c.id} event boundary`);assert.ok(contrast(c.color,'#FFFFFF')>=3,`${c.id} white-slate boundary`);}
});
