function maskedEval(src, ctx = {}) {
    ctx = new Proxy(ctx, {
        has: () => true
    })
    // execute script in private context
    // with (this) {
    //     function decide(beingHistory, Action) {
    //         return Action.DEFECT;
    //     }
    //     return decide(this.beingHistory, this.Action)
    // }
    let func = (new Function(`with(this) {${src}; return decide(this.beingHistory, this.Action)}`));
    return func.call(ctx);
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}