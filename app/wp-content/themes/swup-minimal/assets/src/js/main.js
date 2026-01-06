import '../scss/style.scss';
import Swup from 'swup';
import SwupBodyClassPlugin from '@swup/body-class-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';

if (!window.__swupMinimalLoaded) {
  window.__swupMinimalLoaded = true;
  console.log('vite main loaded');
}

var origin = window.location.origin;
var linkSelector = 'a[href^="/"]:not([target="_blank"]):not([data-no-swup]):not([download])' +
  ':not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])' +
  ':not([href*="/wp-admin"]):not([href*="/wp-login.php"]), ' +
  'a[href^="' + origin + '"]:not([target="_blank"]):not([data-no-swup]):not([download])' +
  ':not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])' +
  ':not([href*="/wp-admin"]):not([href*="/wp-login.php"])';

function isSameOrigin(link) {
  return link.origin === window.location.origin;
}

function shouldHandleLink(link) {
  if (!link || link.tagName !== 'A') {
    return false;
  }
  if (!link.href) {
    return false;
  }
  if (!isSameOrigin(link)) {
    return false;
  }
  if (link.target === '_blank') {
    return false;
  }
  if (link.hasAttribute('data-no-swup')) {
    return false;
  }
  if (link.hasAttribute('download')) {
    return false;
  }
  if (link.getAttribute('href') && link.getAttribute('href').charAt(0) === '#') {
    return false;
  }
  if (link.href.indexOf('mailto:') === 0 || link.href.indexOf('tel:') === 0) {
    return false;
  }
  if (link.href.indexOf('/wp-admin') !== -1 || link.href.indexOf('/wp-login.php') !== -1) {
    return false;
  }
  return true;
}

function initPage() {
  if (!window.__swupMinimalGuardInstalled) {
    window.__swupMinimalGuardInstalled = true;
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a');
      if (!shouldHandleLink(link)) {
        event.stopImmediatePropagation();
      }
    }, true);
  }
}

if (!window.__swupMinimalInstance) {
  window.__swupMinimalInstance = new Swup({
    containers: ['#swup'],
    linkSelector: linkSelector,
    animationSelector: '.swup-transition',
    plugins: [
      new SwupBodyClassPlugin(),
      new SwupHeadPlugin(),
      new SwupPreloadPlugin()
    ]
  });

  console.log('swup initialized');

  window.__swupMinimalInstance.hooks.on('content:replace', function () {
    console.log('swup content replaced');
    initPage();
    document.dispatchEvent(new CustomEvent('swup:replaced'));
    console.log('page view', window.location.pathname);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: window.location.pathname
      });
    }
  });
}

initPage();
