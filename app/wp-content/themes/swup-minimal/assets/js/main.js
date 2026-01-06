document.addEventListener('DOMContentLoaded', function () {
    var origin = window.location.origin;
    var linkSelector = 'a[href^="/"]:not([target="_blank"]):not([data-no-swup]), ' +
        'a[href^="' + origin + '"]:not([target="_blank"]):not([data-no-swup])';

    if (typeof Swup === 'function') {
        var swup = new Swup({
            containers: ['#swup'],
            linkSelector: linkSelector
        });

        console.log('swup initialized');

        swup.on('contentReplaced', function () {
            console.log('swup content replaced');
        });
    } else {
        console.warn('Swup is not loaded');
    }
});
