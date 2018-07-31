
import * as settings from './settings.js'

const m = new Map();
m.set('m1', new Map());
m.get('m1').set(1,'a');
m.get('m1').set(2,'b');
m.get('m1').set(3, new Set([1,2,4,5]));

let json = JSON.stringify(m,replacer);
console.log(json);
console.log(JSON.parse(json,reviver).get('m1').get(2));
console.log([...JSON.parse(json,reviver).get('m1').get(3)]);
