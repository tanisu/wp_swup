import Swup from 'swup';
import SwupBodyClassPlugin from '@swup/body-class-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupJsPlugin from '@swup/js-plugin';
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

function isContactPath(pathname) {
  return pathname === '/contact' || pathname.indexOf('/contact/') === 0;
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
  if (isContactPath(link.pathname)) {
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

function animateMain(target, keyframes, options) {
  if (!target || typeof target.animate !== 'function') {
    return Promise.resolve();
  }

  target.style.willChange = 'opacity, transform';
  var animation = target.animate(keyframes, options);

  return animation.finished
    .catch(function () {})
    .then(function () {
      target.style.willChange = '';
    });
}

function getTransitionLayer() {
  var layer = document.getElementById('swup-transition-layer');
  if (layer) {
    return layer;
  }

  // オーバーレイをカスタムする場合はこのブロックを編集してください。
  // 例: 背景色/グラデーション変更、画像要素をappendして演出素材を重ねる。
  layer = document.createElement('div');
  layer.id = 'swup-transition-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.position = 'fixed';
  layer.style.inset = '0';
  layer.style.zIndex = '9999';
  layer.style.pointerEvents = 'none';
  layer.style.background = 'linear-gradient(180deg, #0b56f0 0%, #0a1124 100%)';
  layer.style.transform = 'translateY(100%)';
  layer.style.willChange = 'transform';
  document.body.appendChild(layer);

  // 画像を使う場合の例:
  // var img = document.createElement('img');
  // img.src = '/wp-content/themes/swup-minimal/assets/dist/images/transition.jpg';
  // img.alt = '';
  // img.style.width = '100%';
  // img.style.height = '100%';
  // img.style.objectFit = 'cover';
  // layer.appendChild(img);

  return layer;
}

function animateLayer(layer, keyframes, options) {
  if (!layer || typeof layer.animate !== 'function') {
    return Promise.resolve();
  }

  var animation = layer.animate(keyframes, options);
  return animation.finished.catch(function () {});
}

if (!window.__swupMinimalInstance) {
  window.__swupMinimalInstance = new Swup({
    containers: ['#swup'],
    linkSelector: linkSelector,
    animationSelector: '.swup-transition',
    ignoreVisit: function (url) {
      var parsedUrl = new URL(url, window.location.origin);
      return isContactPath(parsedUrl.pathname);
    },
    plugins: [
      new SwupBodyClassPlugin(),
      new SwupHeadPlugin(),
      new SwupJsPlugin({
        animations: [
          {
            from: '(.*)',
            to: '(.*)',
            out: function () {
              var layer = getTransitionLayer();
              var main = document.querySelector('#swup');

              // フェーズ1: 下からトランジションレイヤーを上げて現在ページを覆う。
              var layerIn = animateLayer(layer, [
                { transform: 'translateY(100%)' },
                { transform: 'translateY(0%)' }
              ], {
                duration: 520,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'forwards'
              });

              // レイヤー上昇中に現在コンテンツを軽くフェードさせる。
              var mainOut = animateMain(main, [
                { opacity: 1, transform: 'translateY(0) scale(1)' },
                { opacity: 0.8, transform: 'translateY(8px) scale(0.998)' }
              ], {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
              });

              return Promise.all([layerIn, mainOut]);
            },
            in: function () {
              var layer = getTransitionLayer();
              var main = document.querySelector('#swup');

              // 差し替え後の新コンテンツ表示を初期状態としてそろえる。
              if (main) {
                main.style.opacity = '1';
                main.style.transform = 'translateY(0) scale(1)';
              }

              // フェーズ2: レイヤーを上へ抜いて新しいページを見せる。
              return animateLayer(layer, [
                { transform: 'translateY(0%)' },
                { transform: 'translateY(-100%)' }
              ], {
                duration: 560,
                easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                fill: 'forwards'
              }).then(function () {
                layer.style.transform = 'translateY(100%)';
              });
            }
          }
        ]
      }),
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
