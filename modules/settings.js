
/* See:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export
 * https://hacks.mozilla.org/2015/08/es6-in-depth-modules/
 */

/***************************
 * Since browser.storage cannot handle Maps / Sets, use a
 * custom replacer() / reviver() to store settings as JSON
 * (standard stringify() / parse() does not handle these either)
 ***************************/

const KEYWORDS_JSON = new Map([
    [Map, '__Map__']
    , [Set, '__Set__']
]);

function isa(obj,type) {
    // alternative to:
    // 1: obj instanceof type (does not work for literals e.g. 'abc' instanceof String
    // 2: obj.constructor === type (does not work with numbers e.g. 2.constructor)
    return Object.getPrototypeOf(obj).constructor === type;;
}

function replacer(k,v) {
    for (k of KEYWORDS_JSON.keys()) {
        if( isa(v,k) ) {
            return KEYWORDS_JSON.get(k) + '{' + JSON.stringify([...v],replacer) + '}';
        }
    }

    return v;
}

function reviver(k,v){
    if (isa(v,String) && v.substr(-1,1)==='}') {
        for ( const type_kw of KEYWORDS_JSON.entries() ) {
            const kw = type_kw[1] + '{';
            if (v.substr(0,kw.length) === kw) {
                const type = type_kw[0];
                const contents = v.substring(kw.length,v.length-1);

                return new type( JSON.parse(contents, reviver) );
            }
        }
    }

    return v;
}

export function save(obj) {
    // returns Promise that will be fullfilled with no arguments
    const obj_json = Object.create(null);
    for (const k in obj){
        obj_json[k] = JSON.stringify(obj[k],replacer);
    }

    return browser.storage.local.set(obj_json);
}

export function load(keys) {
    // returns Promise that will be fullfilled with 'obj' as argument
    return browser.storage.local.get(keys).then( (obj_json)=>{
        // don't use Object.create(null) here because we want to use
        // methods like obj.hasOwnProperty()
        const obj = new Object();
        for (const k in obj_json){
            obj[k] = JSON.parse(obj_json[k],reviver);
        }

        return obj;
    });
}


/***************************
 * Default settings
 ***************************/

export function defaultSettings() {
    const settings = Object.create(null);

    const settings_sites    = new Map();
    settings['sites']       = settings_sites;
    settings['version']     = browser.runtime.getManifest().version;
    settings['firstRun']    = new Date();

    const sites_visibility = [
        "*://*.8tracks.com/*"
        , "*://*.accuradio.com/*"
        , "*://*.jango.com/*"
        , "*://*.pandora.com/*"
        , "*://*.slacker.com/*"
        , "*://*.youtube.com/*"
    ];

    const sites_touch = [
        "*://*.dailymail.co.uk/*"
        , "*://*.example.com/*"
    ];

    const sites_clipboard = [
        "*://*.hackerrank.com/*"
    ];

    // 0 = inactive
    // 1 = block
    // 2 = log
    const events_visibility = new Set([
        'blur'
        , 'focusout'
        , 'pagehide'
        , 'resize'
        , 'visibilitychange'
    ]);

    const events_touch = new Set([
        'touchcancel'
        , 'touchend'
        , 'touchmove'
        , 'touchstart'
    ]);

    const events_clipboard = new Set([
        'copy'
        , 'cut'
        , 'paste'
        , 'select'
        , 'contextmenu'
        , 'compositionstart'
        , 'compositionupdate'
        , 'compositionend'
    ]);

    const events_other = new Set([
        'DOMContentLoaded'
        , 'beforeunload'
        , 'onreadystatechange'
        , 'scroll'
        , 'unload'
    ]);

    const events_all = new Set([...events_visibility, ...events_touch, ...events_clipboard, ...events_other].sort());
    settings['events'] = events_all;

    // 0 = off
    // 1 = on
    const special_methods_visibility = new Set([
        'action_setToForeground'
    ]);

    const special_methods_other = new Set([
        'log_event_visibilitychange_visibilityState'
        , 'log_interval_pageProperties'
    ]);

    const special_methods_all = new Set([...special_methods_visibility, ...special_methods_other].sort());
    settings['special_methods'] = special_methods_all;

    const apply_settings = (sites,events)=>{
        for (const s of sites){
            settings_sites.set(s,new Map());

            const evts = new Map();
            events.forEach((x)=>{ evts.set(x,1) });
            settings_sites.get(s).set('events', evts);

            settings_sites.get(s).set('special_methods', new Map());
        }
    }

    apply_settings(sites_touch     , events_touch);
    apply_settings(sites_clipboard , events_clipboard);
    apply_settings(sites_visibility, events_visibility);

    for (const s of sites_visibility){
        const special_methods = new Map();
        special_methods_visibility.forEach((x)=>{ special_methods.set(x,1) });
        settings_sites.get(s).set('special_methods',  special_methods);
    }

    console.log('defaultSettings(): ', settings);

    return settings;
}



/* [UNUSED; but maybe useful in the future]
export class Associative {
    constructor(obj) {
        if (obj === undefined) {
            this.storage = Object.create(null);
        } else {
            this.storage = obj;
        }
    }

    set(k,v) {
        this.storage[k] = v;
    }

    get(k) {
        const v = this.storage[k];
        if( typeof v === 'object' && typeof v !== null) {
            return new Associative(v);
        } else {
            return v;
        }
    }

    stringify() {
        return JSON.stringify(this.storage);
    }

    static parse(str) {
        return new Associative( JSON.parse(str) );
    }

    toStorage() {
        const obj = Object.create(null);
        for (const k in this.storage) {
            obj[k] = this.storage[k].stringify();
        }
        return obj;
    }

    static fromStorage(obj) {
        const a = new Associative();
        for (const k in obj) {
            a.set(k, Associative.parse(obj[k]));
        }
        return a;
    }
}

// let a = new Associative();
// a.set('k1','v1');
// a.set('k2', {a : 2});
// const v1 = a.get('k1');
// const v2 = a.get('k2');
// console.log(v1);
// console.log(v2.get('a'));
// console.log(Object.keys(a));
// const str = a.stringify();
// console.log(str);
// const o = Associative.parse(str);
// console.log(o.stringify());
*/


