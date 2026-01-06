import '../scss/style.scss';
import Swup from 'swup';

if (!window.__swupMinimalLoaded) {
  window.__swupMinimalLoaded = true;
  console.log('vite main loaded');
}

var origin = window.location.origin;
var linkSelector = 'a[href^="/"]:not([target="_blank"]):not([data-no-swup]), ' +
  'a[href^="' + origin + '"]:not([target="_blank"]):not([data-no-swup])';

if (!window.__swupMinimalInstance) {
  window.__swupMinimalInstance = new Swup({
    containers: ['#swup'],
    linkSelector: linkSelector,
    animationSelector: '.swup-transition'
  });

  console.log('swup initialized');

  window.__swupMinimalInstance.hooks.on('content:replace', function () {
    console.log('swup content replaced');
  });
}
