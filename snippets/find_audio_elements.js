
// a basic basic but useful functionality is:
// [...document.getElementsByTagName('video')].forEach(x=>x.playbackRate=4);

// 8tracks.com has it's player in window.soundManager.sounds and window.soundManager.soundIDs
// e.g. in console:
// Note that:
// window.soundManager.sounds[ window.soundManager.soundIDs.slice(-1)[0] ]._a === window.soundManager.sounds.silence._a
// window.soundManager.sounds.silence._a.playbackRate = 2.0;
//
// soundManager.pauseAll();
// var lastSound = window.soundManager.soundIDs.slice(-1)[0];
// [...Object.values(window.soundManager.sounds)][1]._a // this is the html audio tag
// [...Object.values(window.soundManager.sounds)][1].togglePause();
// window.soundManager.sounds[ window.soundManager.soundIDs.slice(-1)[0] ].setPlaybackRate(4, true);
// [...Object.values(window.soundManager.sounds)][1].setPosition(2*1000);
// window.soundManager.sounds[ window.soundManager.soundIDs.slice(-1)[0] ].setPosition(2*1000);
// in the soundManager code look for somethingn like 'new Audio(...)';

function getObjsByType(type) {
    const jsObjs    = getObjsByPrototype(window, 20, 1e5, new RegExp(type, 'i'));
    const domObjs   = document.getElementsByTagName(type);
    return new Set([...[...jsObjs].map(x=>x.obj), ...domObjs]);
}

function getObjsByPrototype(obj, maxDepth, maxAll, regex, verbosity) {
    const iframe    = _restoreConsole();
    // Weakset allows objects to be destroyed and garbage collected but it's elements cannot be accessed
    // Weakset really only answers the question of whether an object is already in the set
    const objs      = _getObjsByPrototype(obj, maxDepth, regex, '', new WeakSet(), new Set());
    console.log(`maxAll: ${maxAll}`);
    iframe.parentNode.removeChild(iframe);
    return objs;

    function _getObjsByPrototype(obj, maxDepth, regex, path, objRefs, objs) {
        verbosity>=2 && console.log(`${maxAll}: ${path}`);
        const iter = obj instanceof Array ? [...obj.keys] : Object.keys(obj);
        for (const k of iter){
            try {
                const obj_v     = obj[k];
                const newPath   = `${path}.${k}`;
                if ( --maxAll < 0 ) {
                    verbosity>=2 && console.warn(`hit maxAll in ${newPath}`);
                    break;
                }
                if ( obj_v == null || _circularChecker(objRefs, obj_v) ) {
                    verbosity>=2 && console.warn(`hit circular in ${newPath}`);
                    continue;
                }
                const objType = Object.prototype.toString.call(obj_v);

                if ( regex.test(objType) ) { // || regex.test(newPath) ) {
                    console.log(`found ${objType} @ ${newPath}`);
                    objs.add({path: newPath, obj: obj_v});
                }

                if (maxDepth>0 && ! [String].includes(Object.getPrototypeOf(obj_v).constructor)) {
                    _getObjsByPrototype(obj_v, maxDepth-1, regex, newPath, objRefs, objs);
                } else {
                    verbosity>=2 && console.warn(`hit maxDepth in ${newPath}`);
                }
            } catch (err) {
                verbosity>=2 && console.log(`in ${path}.${k}: ${err.message}`);
            }
        }

        return objs;
    }

    function _circularChecker(objRefs, value) {
        if (value != null && typeof value == "object") {
            if ( objRefs.has(value) ) { return true; }
            else { objRefs.add(value); }
        }

        return false;
    };

    function _restoreConsole() {
        // from https://stackoverflow.com/questions/7089443/restoring-console-log
        var i = document.createElement('iframe');
        i.style.display = 'none';
        document.body.appendChild(i);
        window.console = i.contentWindow.console;
        // i.parentNode.removeChild(i);
        return i;
    }
}

getObjsByType('video').forEach(x=>x.playbackRate=0.5)
getObjsByType('audio').forEach(x=>x.playbackRate=0.5)

getObjsByPrototype(window.parent.soundManager.sounds, 1, 1e4, new RegExp('audio', 'i'), 0);
getObjsByPrototype(window.parent.soundManager.sounds, 5, 1e4, new RegExp('audio', 'i'), 0);

getObjsByPrototype(window, 5, 1e4, new RegExp('video', 'i'));

getObjsByPrototype(window, 5, 1e4, new RegExp('audio', 'i'));

getObjsByPrototype(window, 5, 1e4, new RegExp('soundManager', 'i'));

