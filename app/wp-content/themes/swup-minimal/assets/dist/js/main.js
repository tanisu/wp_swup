const ledger = /* @__PURE__ */ new WeakMap();
function editLedger(wanted, baseElement, callback, setup) {
  if (!wanted && !ledger.has(baseElement)) {
    return false;
  }
  const elementMap = ledger.get(baseElement) ?? /* @__PURE__ */ new WeakMap();
  ledger.set(baseElement, elementMap);
  const setups = elementMap.get(callback) ?? /* @__PURE__ */ new Set();
  elementMap.set(callback, setups);
  const existed = setups.has(setup);
  if (wanted) {
    setups.add(setup);
  } else {
    setups.delete(setup);
  }
  return existed && wanted;
}
function safeClosest(event, selector) {
  let target = event.target;
  if (target instanceof Text) {
    target = target.parentElement;
  }
  if (target instanceof Element && event.currentTarget instanceof Node) {
    const closest = target.closest(selector);
    if (closest && event.currentTarget.contains(closest)) {
      return closest;
    }
  }
}
function delegate(selector, type, callback, options = {}) {
  const { signal, base = document } = options;
  if (signal == null ? void 0 : signal.aborted) {
    return;
  }
  const { once, ...nativeListenerOptions } = options;
  const baseElement = base instanceof Document ? base.documentElement : base;
  const capture = Boolean(typeof options === "object" ? options.capture : options);
  const listenerFunction = (event) => {
    const delegateTarget = safeClosest(event, String(selector));
    if (delegateTarget) {
      const delegateEvent = Object.assign(event, { delegateTarget });
      callback.call(baseElement, delegateEvent);
      if (once) {
        baseElement.removeEventListener(type, listenerFunction, nativeListenerOptions);
        editLedger(false, baseElement, callback, setup);
      }
    }
  };
  const setup = JSON.stringify({ selector, type, capture });
  const isAlreadyListening = editLedger(true, baseElement, callback, setup);
  if (!isAlreadyListening) {
    baseElement.addEventListener(type, listenerFunction, nativeListenerOptions);
  }
  signal == null ? void 0 : signal.addEventListener("abort", () => {
    editLedger(false, baseElement, callback, setup);
  });
}
function lexer(str) {
  var tokens = [];
  var i3 = 0;
  while (i3 < str.length) {
    var char = str[i3];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i3, value: str[i3++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i3++, value: str[i3++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i3, value: str[i3++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i3, value: str[i3++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j2 = i3 + 1;
      while (j2 < str.length) {
        var code = str.charCodeAt(j2);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j2++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i3));
      tokens.push({ type: "NAME", index: i3, value: name });
      i3 = j2;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j2 = i3 + 1;
      if (str[j2] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j2));
      }
      while (j2 < str.length) {
        if (str[j2] === "\\") {
          pattern += str[j2++] + str[j2++];
          continue;
        }
        if (str[j2] === ")") {
          count--;
          if (count === 0) {
            j2++;
            break;
          }
        } else if (str[j2] === "(") {
          count++;
          if (str[j2 + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j2));
          }
        }
        pattern += str[j2++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i3));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i3));
      tokens.push({ type: "PATTERN", index: i3, value: pattern });
      i3 = j2;
      continue;
    }
    tokens.push({ type: "CHAR", index: i3, value: str[i3++] });
  }
  tokens.push({ type: "END", index: i3, value: "" });
  return tokens;
}
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i3 = 0;
  var path = "";
  var tryConsume = function(type) {
    if (i3 < tokens.length && tokens[i3].type === type)
      return tokens[i3++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i3], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  var isSafe = function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  };
  var safePattern = function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  };
  while (i3 < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x2) {
    return x2;
  } : _a;
  return function(pathname) {
    var m2 = re.exec(pathname);
    if (!m2)
      return false;
    var path = m2[0], index = m2.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i4) {
      if (m2[i4] === void 0)
        return "continue";
      var key = keys[i4 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m2[i4].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m2[i4], key);
      }
    };
    for (var i3 = 1; i3 < m2.length; i3++) {
      _loop_1(i3);
    }
    return { path, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x2) {
    return x2;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
function i$2() {
  return i$2 = Object.assign ? Object.assign.bind() : function(t2) {
    for (var e3 = 1; e3 < arguments.length; e3++) {
      var i3 = arguments[e3];
      for (var s2 in i3) ({}).hasOwnProperty.call(i3, s2) && (t2[s2] = i3[s2]);
    }
    return t2;
  }, i$2.apply(null, arguments);
}
const s$3 = (t2, e3) => String(t2).toLowerCase().replace(/[\s/_.]+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "") || e3 || "", n$4 = ({ hash: t2 } = {}) => window.location.pathname + window.location.search + (t2 ? window.location.hash : ""), o$4 = (t2, e3 = {}) => {
  const s2 = i$2({ url: t2 = t2 || n$4({ hash: true }), random: Math.random(), source: "swup" }, e3);
  window.history.pushState(s2, "", t2);
}, r$3 = (t2 = null, e3 = {}) => {
  t2 = t2 || n$4({ hash: true });
  const s2 = i$2({}, window.history.state || {}, { url: t2, random: Math.random(), source: "swup" }, e3);
  window.history.replaceState(s2, "", t2);
}, a$2 = (e3, s2, n2, o3) => {
  const r2 = new AbortController();
  return o3 = i$2({}, o3, { signal: r2.signal }), delegate(e3, s2, n2, o3), { destroy: () => r2.abort() };
};
let l$1 = class l extends URL {
  constructor(t2, e3 = document.baseURI) {
    super(t2.toString(), e3), Object.setPrototypeOf(this, l.prototype);
  }
  get url() {
    return this.pathname + this.search;
  }
  static fromElement(t2) {
    const e3 = t2.getAttribute("href") || t2.getAttribute("xlink:href") || "";
    return new l(e3);
  }
  static fromUrl(t2) {
    return new l(t2);
  }
};
const h = (t2, i3) => {
  Array.isArray(t2) && !t2.length && (t2 = "");
  try {
    return match(t2, i3);
  } catch (e3) {
    throw new Error(`[swup] Error parsing path "${String(t2)}":
${String(e3)}`);
  }
};
class c extends Error {
  constructor(t2, e3) {
    super(t2), this.url = void 0, this.status = void 0, this.aborted = void 0, this.timedOut = void 0, this.name = "FetchError", this.url = e3.url, this.status = e3.status, this.aborted = e3.aborted || false, this.timedOut = e3.timedOut || false;
  }
}
async function u(t2, e3 = {}) {
  var s2;
  t2 = l$1.fromUrl(t2).url;
  const { visit: n2 = this.visit } = e3, o3 = i$2({}, this.options.requestHeaders, e3.headers), r2 = null != (s2 = e3.timeout) ? s2 : this.options.timeout, a2 = new AbortController(), { signal: h2 } = a2;
  e3 = i$2({}, e3, { headers: o3, signal: h2 });
  let u2, d2 = false, p2 = null;
  r2 && r2 > 0 && (p2 = setTimeout(() => {
    d2 = true, a2.abort("timeout");
  }, r2));
  try {
    u2 = await this.hooks.call("fetch:request", n2, { url: t2, options: e3 }, (t3, { url: e4, options: i3 }) => fetch(e4, i3)), p2 && clearTimeout(p2);
  } catch (e4) {
    if (d2) throw this.hooks.call("fetch:timeout", n2, { url: t2 }), new c(`Request timed out: ${t2}`, { url: t2, timedOut: d2 });
    if ("AbortError" === (null == e4 ? void 0 : e4.name) || h2.aborted) throw new c(`Request aborted: ${t2}`, { url: t2, aborted: true });
    throw e4;
  }
  const { status: m2, url: w2 } = u2, f2 = await u2.text();
  if (500 === m2) throw this.hooks.call("fetch:error", n2, { status: m2, response: u2, url: w2 }), new c(`Server error: ${w2}`, { status: m2, url: w2 });
  if (!f2) throw new c(`Empty response: ${w2}`, { status: m2, url: w2 });
  const { url: g2 } = l$1.fromUrl(w2), v = { url: g2, html: f2 };
  return !n2.cache.write || e3.method && "GET" !== e3.method || t2 !== g2 || this.cache.set(v.url, v), v;
}
class d {
  constructor(t2) {
    this.swup = void 0, this.pages = /* @__PURE__ */ new Map(), this.swup = t2;
  }
  get size() {
    return this.pages.size;
  }
  get all() {
    const t2 = /* @__PURE__ */ new Map();
    return this.pages.forEach((e3, s2) => {
      t2.set(s2, i$2({}, e3));
    }), t2;
  }
  has(t2) {
    return this.pages.has(this.resolve(t2));
  }
  get(t2) {
    const e3 = this.pages.get(this.resolve(t2));
    return e3 ? i$2({}, e3) : e3;
  }
  set(t2, e3) {
    e3 = i$2({}, e3, { url: t2 = this.resolve(t2) }), this.pages.set(t2, e3), this.swup.hooks.callSync("cache:set", void 0, { page: e3 });
  }
  update(t2, e3) {
    t2 = this.resolve(t2);
    const s2 = i$2({}, this.get(t2), e3, { url: t2 });
    this.pages.set(t2, s2);
  }
  delete(t2) {
    this.pages.delete(this.resolve(t2));
  }
  clear() {
    this.pages.clear(), this.swup.hooks.callSync("cache:clear", void 0, void 0);
  }
  prune(t2) {
    this.pages.forEach((e3, i3) => {
      t2(i3, e3) && this.delete(i3);
    });
  }
  resolve(t2) {
    const { url: e3 } = l$1.fromUrl(t2);
    return this.swup.resolveUrl(e3);
  }
}
const p = (t2, e3 = document) => e3.querySelector(t2), m = (t2, e3 = document) => Array.from(e3.querySelectorAll(t2)), w = () => new Promise((t2) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      t2();
    });
  });
});
function f(t2) {
  return !!t2 && ("object" == typeof t2 || "function" == typeof t2) && "function" == typeof t2.then;
}
function g(t2, e3 = []) {
  return new Promise((i3, s2) => {
    const n2 = t2(...e3);
    f(n2) ? n2.then(i3, s2) : i3(n2);
  });
}
function y(t2, e3) {
  const i3 = null == t2 ? void 0 : t2.closest(`[${e3}]`);
  return null != i3 && i3.hasAttribute(e3) ? (null == i3 ? void 0 : i3.getAttribute(e3)) || true : void 0;
}
class k {
  constructor(t2) {
    this.swup = void 0, this.swupClasses = ["to-", "is-changing", "is-rendering", "is-popstate", "is-animating", "is-leaving"], this.swup = t2;
  }
  get selectors() {
    const { scope: t2 } = this.swup.visit.animation;
    return "containers" === t2 ? this.swup.visit.containers : "html" === t2 ? ["html"] : Array.isArray(t2) ? t2 : [];
  }
  get selector() {
    return this.selectors.join(",");
  }
  get targets() {
    return this.selector.trim() ? m(this.selector) : [];
  }
  add(...t2) {
    this.targets.forEach((e3) => e3.classList.add(...t2));
  }
  remove(...t2) {
    this.targets.forEach((e3) => e3.classList.remove(...t2));
  }
  clear() {
    this.targets.forEach((t2) => {
      const e3 = t2.className.split(" ").filter((t3) => this.isSwupClass(t3));
      t2.classList.remove(...e3);
    });
  }
  isSwupClass(t2) {
    return this.swupClasses.some((e3) => t2.startsWith(e3));
  }
}
class b {
  constructor(t2, e3) {
    this.id = void 0, this.state = void 0, this.from = void 0, this.to = void 0, this.containers = void 0, this.animation = void 0, this.trigger = void 0, this.cache = void 0, this.history = void 0, this.scroll = void 0, this.meta = void 0;
    const { to: i3, from: s2, hash: n2, el: o3, event: r2 } = e3;
    this.id = Math.random(), this.state = 1, this.from = { url: null != s2 ? s2 : t2.location.url, hash: t2.location.hash }, this.to = { url: i3, hash: n2 }, this.containers = t2.options.containers, this.animation = { animate: true, wait: false, name: void 0, native: t2.options.native, scope: t2.options.animationScope, selector: t2.options.animationSelector }, this.trigger = { el: o3, event: r2 }, this.cache = { read: t2.options.cache, write: t2.options.cache }, this.history = { action: "push", popstate: false, direction: void 0 }, this.scroll = { reset: true, target: void 0 }, this.meta = {};
  }
  advance(t2) {
    this.state < t2 && (this.state = t2);
  }
  abort() {
    this.state = 8;
  }
  get done() {
    return this.state >= 7;
  }
}
function S(t2) {
  return new b(this, t2);
}
class E {
  constructor(t2) {
    this.swup = void 0, this.registry = /* @__PURE__ */ new Map(), this.hooks = ["animation:out:start", "animation:out:await", "animation:out:end", "animation:in:start", "animation:in:await", "animation:in:end", "animation:skip", "cache:clear", "cache:set", "content:replace", "content:scroll", "enable", "disable", "fetch:request", "fetch:error", "fetch:timeout", "history:popstate", "link:click", "link:self", "link:anchor", "link:newtab", "page:load", "page:view", "scroll:top", "scroll:anchor", "visit:start", "visit:transition", "visit:abort", "visit:end"], this.swup = t2, this.init();
  }
  init() {
    this.hooks.forEach((t2) => this.create(t2));
  }
  create(t2) {
    this.registry.has(t2) || this.registry.set(t2, /* @__PURE__ */ new Map());
  }
  exists(t2) {
    return this.registry.has(t2);
  }
  get(t2) {
    const e3 = this.registry.get(t2);
    if (e3) return e3;
    console.error(`Unknown hook '${t2}'`);
  }
  clear() {
    this.registry.forEach((t2) => t2.clear());
  }
  on(t2, e3, s2 = {}) {
    const n2 = this.get(t2);
    if (!n2) return console.warn(`Hook '${t2}' not found.`), () => {
    };
    const o3 = i$2({}, s2, { id: n2.size + 1, hook: t2, handler: e3 });
    return n2.set(e3, o3), () => this.off(t2, e3);
  }
  before(t2, e3, s2 = {}) {
    return this.on(t2, e3, i$2({}, s2, { before: true }));
  }
  replace(t2, e3, s2 = {}) {
    return this.on(t2, e3, i$2({}, s2, { replace: true }));
  }
  once(t2, e3, s2 = {}) {
    return this.on(t2, e3, i$2({}, s2, { once: true }));
  }
  off(t2, e3) {
    const i3 = this.get(t2);
    i3 && e3 ? i3.delete(e3) || console.warn(`Handler for hook '${t2}' not found.`) : i3 && i3.clear();
  }
  async call(t2, e3, i3, s2) {
    const [n2, o3, r2] = this.parseCallArgs(t2, e3, i3, s2), { before: a2, handler: l3, after: h2 } = this.getHandlers(t2, r2);
    await this.run(a2, n2, o3);
    const [c2] = await this.run(l3, n2, o3, true);
    return await this.run(h2, n2, o3), this.dispatchDomEvent(t2, n2, o3), c2;
  }
  callSync(t2, e3, i3, s2) {
    const [n2, o3, r2] = this.parseCallArgs(t2, e3, i3, s2), { before: a2, handler: l3, after: h2 } = this.getHandlers(t2, r2);
    this.runSync(a2, n2, o3);
    const [c2] = this.runSync(l3, n2, o3, true);
    return this.runSync(h2, n2, o3), this.dispatchDomEvent(t2, n2, o3), c2;
  }
  parseCallArgs(t2, e3, i3, s2) {
    return e3 instanceof b || "object" != typeof e3 && "function" != typeof i3 ? [e3, i3, s2] : [void 0, e3, i3];
  }
  async run(t2, e3 = this.swup.visit, i3, s2 = false) {
    const n2 = [];
    for (const { hook: o3, handler: r2, defaultHandler: a2, once: l3 } of t2) if (null == e3 || !e3.done) {
      l3 && this.off(o3, r2);
      try {
        const t3 = await g(r2, [e3, i3, a2]);
        n2.push(t3);
      } catch (t3) {
        if (s2) throw t3;
        console.error(`Error in hook '${o3}':`, t3);
      }
    }
    return n2;
  }
  runSync(t2, e3 = this.swup.visit, i3, s2 = false) {
    const n2 = [];
    for (const { hook: o3, handler: r2, defaultHandler: a2, once: l3 } of t2) if (null == e3 || !e3.done) {
      l3 && this.off(o3, r2);
      try {
        const t3 = r2(e3, i3, a2);
        n2.push(t3), f(t3) && console.warn(`Swup will not await Promises in handler for synchronous hook '${o3}'.`);
      } catch (t3) {
        if (s2) throw t3;
        console.error(`Error in hook '${o3}':`, t3);
      }
    }
    return n2;
  }
  getHandlers(t2, e3) {
    const i3 = this.get(t2);
    if (!i3) return { found: false, before: [], handler: [], after: [], replaced: false };
    const s2 = Array.from(i3.values()), n2 = this.sortRegistrations, o3 = s2.filter(({ before: t3, replace: e4 }) => t3 && !e4).sort(n2), r2 = s2.filter(({ replace: t3 }) => t3).filter((t3) => true).sort(n2), a2 = s2.filter(({ before: t3, replace: e4 }) => !t3 && !e4).sort(n2), l3 = r2.length > 0;
    let h2 = [];
    if (e3 && (h2 = [{ id: 0, hook: t2, handler: e3 }], l3)) {
      const i4 = r2.length - 1, { handler: s3, once: n3 } = r2[i4], o4 = (t3) => {
        const i5 = r2[t3 - 1];
        return i5 ? (e4, s4) => i5.handler(e4, s4, o4(t3 - 1)) : e3;
      };
      h2 = [{ id: 0, hook: t2, once: n3, handler: s3, defaultHandler: o4(i4) }];
    }
    return { found: true, before: o3, handler: h2, after: a2, replaced: l3 };
  }
  sortRegistrations(t2, e3) {
    var i3, s2;
    return (null != (i3 = t2.priority) ? i3 : 0) - (null != (s2 = e3.priority) ? s2 : 0) || t2.id - e3.id || 0;
  }
  dispatchDomEvent(t2, e3, i3) {
    if (null != e3 && e3.done) return;
    const s2 = { hook: t2, args: i3, visit: e3 || this.swup.visit };
    document.dispatchEvent(new CustomEvent("swup:any", { detail: s2, bubbles: true })), document.dispatchEvent(new CustomEvent(`swup:${t2}`, { detail: s2, bubbles: true }));
  }
  parseName(t2) {
    const [e3, ...s2] = t2.split(".");
    return [e3, s2.reduce((t3, e4) => i$2({}, t3, { [e4]: true }), {})];
  }
}
const C = (t2) => {
  if (t2 && "#" === t2.charAt(0) && (t2 = t2.substring(1)), !t2) return null;
  const e3 = decodeURIComponent(t2);
  let i3 = document.getElementById(t2) || document.getElementById(e3) || p(`a[name='${CSS.escape(t2)}']`) || p(`a[name='${CSS.escape(e3)}']`);
  return i3 || "top" !== t2 || (i3 = document.body), i3;
}, U = "transition", P = "animation";
async function $({ selector: t2, elements: e3 }) {
  if (false === t2 && !e3) return;
  let i3 = [];
  if (e3) i3 = Array.from(e3);
  else if (t2 && (i3 = m(t2, document.body), !i3.length)) return void console.warn(`[swup] No elements found matching animationSelector \`${t2}\``);
  const s2 = i3.map((t3) => function(t4) {
    const { type: e4, timeout: i4, propCount: s3 } = function(t5) {
      const e5 = window.getComputedStyle(t5), i5 = A(e5, `${U}Delay`), s4 = A(e5, `${U}Duration`), n2 = x(i5, s4), o3 = A(e5, `${P}Delay`), r2 = A(e5, `${P}Duration`), a2 = x(o3, r2), l3 = Math.max(n2, a2), h2 = l3 > 0 ? n2 > a2 ? U : P : null;
      return { type: h2, timeout: l3, propCount: h2 ? h2 === U ? s4.length : r2.length : 0 };
    }(t4);
    return !(!e4 || !i4) && new Promise((n2) => {
      const o3 = `${e4}end`, r2 = performance.now();
      let a2 = 0;
      const l3 = () => {
        t4.removeEventListener(o3, h2), n2();
      }, h2 = (e5) => {
        e5.target === t4 && ((performance.now() - r2) / 1e3 < e5.elapsedTime || ++a2 >= s3 && l3());
      };
      setTimeout(() => {
        a2 < s3 && l3();
      }, i4 + 1), t4.addEventListener(o3, h2);
    });
  }(t3));
  s2.filter(Boolean).length > 0 ? await Promise.all(s2) : t2 && console.warn(`[swup] No CSS animation duration defined on elements matching \`${t2}\``);
}
function A(t2, e3) {
  return (t2[e3] || "").split(", ");
}
function x(t2, e3) {
  for (; t2.length < e3.length; ) t2 = t2.concat(t2);
  return Math.max(...e3.map((e4, i3) => H(e4) + H(t2[i3])));
}
function H(t2) {
  return 1e3 * parseFloat(t2);
}
function V(t2, e3 = {}, s2 = {}) {
  if ("string" != typeof t2) throw new Error("swup.navigate() requires a URL parameter");
  if (this.shouldIgnoreVisit(t2, { el: s2.el, event: s2.event })) return void window.location.assign(t2);
  const { url: n2, hash: o3 } = l$1.fromUrl(t2), r2 = this.createVisit(i$2({}, s2, { to: n2, hash: o3 }));
  this.performNavigation(r2, e3);
}
async function I(t2, e3 = {}) {
  if (this.navigating) {
    if (this.visit.state >= 6) return t2.state = 2, void (this.onVisitEnd = () => this.performNavigation(t2, e3));
    await this.hooks.call("visit:abort", this.visit, void 0), delete this.visit.to.document, this.visit.state = 8;
  }
  this.navigating = true, this.visit = t2;
  const { el: i3 } = t2.trigger;
  e3.referrer = e3.referrer || this.location.url, false === e3.animate && (t2.animation.animate = false), t2.animation.animate || this.classes.clear();
  const n2 = e3.history || y(i3, "data-swup-history");
  "string" == typeof n2 && ["push", "replace"].includes(n2) && (t2.history.action = n2);
  const a2 = e3.animation || y(i3, "data-swup-animation");
  var h2, c2;
  "string" == typeof a2 && (t2.animation.name = a2), t2.meta = e3.meta || {}, "object" == typeof e3.cache ? (t2.cache.read = null != (h2 = e3.cache.read) ? h2 : t2.cache.read, t2.cache.write = null != (c2 = e3.cache.write) ? c2 : t2.cache.write) : void 0 !== e3.cache && (t2.cache = { read: !!e3.cache, write: !!e3.cache }), delete e3.cache;
  try {
    await this.hooks.call("visit:start", t2, void 0), t2.state = 3;
    const i4 = this.hooks.call("page:load", t2, { options: e3 }, async (t3, e4) => {
      let i5;
      return t3.cache.read && (i5 = this.cache.get(t3.to.url)), e4.page = i5 || await this.fetchPage(t3.to.url, e4.options), e4.cache = !!i5, e4.page;
    });
    i4.then(({ html: e4 }) => {
      t2.advance(5), t2.to.html = e4, t2.to.document = new DOMParser().parseFromString(e4, "text/html");
    });
    const n3 = t2.to.url + t2.to.hash;
    if (t2.history.popstate || ("replace" === t2.history.action || t2.to.url === this.location.url ? r$3(n3) : (this.currentHistoryIndex++, o$4(n3, { index: this.currentHistoryIndex }))), this.location = l$1.fromUrl(n3), t2.history.popstate && this.classes.add("is-popstate"), t2.animation.name && this.classes.add(`to-${s$3(t2.animation.name)}`), t2.animation.wait && await i4, t2.done) return;
    if (await this.hooks.call("visit:transition", t2, void 0, async () => {
      if (!t2.animation.animate) return await this.hooks.call("animation:skip", void 0), void await this.renderPage(t2, await i4);
      t2.advance(4), await this.animatePageOut(t2), t2.animation.native && document.startViewTransition ? await document.startViewTransition(async () => await this.renderPage(t2, await i4)).finished : await this.renderPage(t2, await i4), await this.animatePageIn(t2);
    }), t2.done) return;
    await this.hooks.call("visit:end", t2, void 0, () => this.classes.clear()), t2.state = 7, this.navigating = false, this.onVisitEnd && (this.onVisitEnd(), this.onVisitEnd = void 0);
  } catch (e4) {
    if (!e4 || null != e4 && e4.aborted) return void (t2.state = 8);
    t2.state = 9, console.error(e4), this.options.skipPopStateHandling = () => (window.location.assign(t2.to.url + t2.to.hash), true), window.history.back();
  } finally {
    delete t2.to.document;
  }
}
const L = async function(t2) {
  await this.hooks.call("animation:out:start", t2, void 0, () => {
    this.classes.add("is-changing", "is-animating", "is-leaving");
  }), await this.hooks.call("animation:out:await", t2, { skip: false }, (t3, { skip: e3 }) => {
    if (!e3) return this.awaitAnimations({ selector: t3.animation.selector });
  }), await this.hooks.call("animation:out:end", t2, void 0);
}, q = function(t2) {
  var e3;
  const i3 = t2.to.document;
  if (!i3) return false;
  const s2 = (null == (e3 = i3.querySelector("title")) ? void 0 : e3.innerText) || "";
  document.title = s2;
  const n2 = m('[data-swup-persist]:not([data-swup-persist=""])'), o3 = t2.containers.map((t3) => {
    const e4 = document.querySelector(t3), s3 = i3.querySelector(t3);
    return e4 && s3 ? (e4.replaceWith(s3.cloneNode(true)), true) : (e4 || console.warn(`[swup] Container missing in current document: ${t3}`), s3 || console.warn(`[swup] Container missing in incoming document: ${t3}`), false);
  }).filter(Boolean);
  return n2.forEach((t3) => {
    const e4 = t3.getAttribute("data-swup-persist"), i4 = p(`[data-swup-persist="${e4}"]`);
    i4 && i4 !== t3 && i4.replaceWith(t3);
  }), o3.length === t2.containers.length;
}, R = function(t2) {
  const e3 = { behavior: "auto" }, { target: s2, reset: n2 } = t2.scroll, o3 = null != s2 ? s2 : t2.to.hash;
  let r2 = false;
  return o3 && (r2 = this.hooks.callSync("scroll:anchor", t2, { hash: o3, options: e3 }, (t3, { hash: e4, options: i3 }) => {
    const s3 = this.getAnchorElement(e4);
    return s3 && s3.scrollIntoView(i3), !!s3;
  })), n2 && !r2 && (r2 = this.hooks.callSync("scroll:top", t2, { options: e3 }, (t3, { options: e4 }) => (window.scrollTo(i$2({ top: 0, left: 0 }, e4)), true))), r2;
}, T = async function(t2) {
  if (t2.done) return;
  const e3 = this.hooks.call("animation:in:await", t2, { skip: false }, (t3, { skip: e4 }) => {
    if (!e4) return this.awaitAnimations({ selector: t3.animation.selector });
  });
  await w(), await this.hooks.call("animation:in:start", t2, void 0, () => {
    this.classes.remove("is-animating");
  }), await e3, await this.hooks.call("animation:in:end", t2, void 0);
}, N = async function(t2, e3) {
  if (t2.done) return;
  t2.advance(6);
  const { url: i3 } = e3;
  this.isSameResolvedUrl(n$4(), i3) || (r$3(i3), this.location = l$1.fromUrl(i3), t2.to.url = this.location.url, t2.to.hash = this.location.hash), await this.hooks.call("content:replace", t2, { page: e3 }, (t3, {}) => {
    if (this.classes.remove("is-leaving"), t3.animation.animate && this.classes.add("is-rendering"), !this.replaceContent(t3)) throw new Error("[swup] Container mismatch, aborting");
    t3.animation.animate && (this.classes.add("is-changing", "is-animating", "is-rendering"), t3.animation.name && this.classes.add(`to-${s$3(t3.animation.name)}`));
  }), await this.hooks.call("content:scroll", t2, void 0, () => this.scrollToContent(t2)), await this.hooks.call("page:view", t2, { url: this.location.url, title: document.title });
}, O = function(t2) {
  var e3;
  if (e3 = t2, Boolean(null == e3 ? void 0 : e3.isSwupPlugin)) {
    if (t2.swup = this, !t2._checkRequirements || t2._checkRequirements()) return t2._beforeMount && t2._beforeMount(), t2.mount(), this.plugins.push(t2), this.plugins;
  } else console.error("Not a swup plugin instance", t2);
};
function D(t2) {
  const e3 = this.findPlugin(t2);
  if (e3) return e3.unmount(), e3._afterUnmount && e3._afterUnmount(), this.plugins = this.plugins.filter((t3) => t3 !== e3), this.plugins;
  console.error("No such plugin", e3);
}
function M(t2) {
  return this.plugins.find((e3) => e3 === t2 || e3.name === t2 || e3.name === `Swup${String(t2)}`);
}
function W(t2) {
  if ("function" != typeof this.options.resolveUrl) return console.warn("[swup] options.resolveUrl expects a callback function."), t2;
  const e3 = this.options.resolveUrl(t2);
  return e3 && "string" == typeof e3 ? e3.startsWith("//") || e3.startsWith("http") ? (console.warn("[swup] options.resolveUrl needs to return a relative url"), t2) : e3 : (console.warn("[swup] options.resolveUrl needs to return a url"), t2);
}
function B(t2, e3) {
  return this.resolveUrl(t2) === this.resolveUrl(e3);
}
const j = { animateHistoryBrowsing: false, animationSelector: '[class*="transition-"]', animationScope: "html", cache: true, containers: ["#swup"], hooks: {}, ignoreVisit: (t2, { el: e3 } = {}) => !(null == e3 || !e3.closest("[data-no-swup]")), linkSelector: "a[href]", linkToSelf: "scroll", native: false, plugins: [], resolveUrl: (t2) => t2, requestHeaders: { "X-Requested-With": "swup", Accept: "text/html, application/xhtml+xml" }, skipPopStateHandling: (t2) => {
  var e3;
  return "swup" !== (null == (e3 = t2.state) ? void 0 : e3.source);
}, timeout: 0 };
class _ {
  get currentPageUrl() {
    return this.location.url;
  }
  constructor(t2 = {}) {
    var e3, s2;
    this.version = "4.8.2", this.options = void 0, this.defaults = j, this.plugins = [], this.visit = void 0, this.cache = void 0, this.hooks = void 0, this.classes = void 0, this.location = l$1.fromUrl(window.location.href), this.currentHistoryIndex = void 0, this.clickDelegate = void 0, this.navigating = false, this.onVisitEnd = void 0, this.use = O, this.unuse = D, this.findPlugin = M, this.log = () => {
    }, this.navigate = V, this.performNavigation = I, this.createVisit = S, this.delegateEvent = a$2, this.fetchPage = u, this.awaitAnimations = $, this.renderPage = N, this.replaceContent = q, this.animatePageIn = T, this.animatePageOut = L, this.scrollToContent = R, this.getAnchorElement = C, this.getCurrentUrl = n$4, this.resolveUrl = W, this.isSameResolvedUrl = B, this.options = i$2({}, this.defaults, t2), this.handleLinkClick = this.handleLinkClick.bind(this), this.handlePopState = this.handlePopState.bind(this), this.cache = new d(this), this.classes = new k(this), this.hooks = new E(this), this.visit = this.createVisit({ to: "" }), this.currentHistoryIndex = null != (e3 = null == (s2 = window.history.state) ? void 0 : s2.index) ? e3 : 1, this.enable();
  }
  async enable() {
    var t2;
    const { linkSelector: e3 } = this.options;
    this.clickDelegate = this.delegateEvent(e3, "click", this.handleLinkClick), window.addEventListener("popstate", this.handlePopState), this.options.animateHistoryBrowsing && (window.history.scrollRestoration = "manual"), this.options.native = this.options.native && !!document.startViewTransition, this.options.plugins.forEach((t3) => this.use(t3));
    for (const [t3, e4] of Object.entries(this.options.hooks)) {
      const [i3, s2] = this.hooks.parseName(t3);
      this.hooks.on(i3, e4, s2);
    }
    "swup" !== (null == (t2 = window.history.state) ? void 0 : t2.source) && r$3(null, { index: this.currentHistoryIndex }), await w(), await this.hooks.call("enable", void 0, void 0, () => {
      const t3 = document.documentElement;
      t3.classList.add("swup-enabled"), t3.classList.toggle("swup-native", this.options.native);
    });
  }
  async destroy() {
    this.clickDelegate.destroy(), window.removeEventListener("popstate", this.handlePopState), this.cache.clear(), this.options.plugins.forEach((t2) => this.unuse(t2)), await this.hooks.call("disable", void 0, void 0, () => {
      const t2 = document.documentElement;
      t2.classList.remove("swup-enabled"), t2.classList.remove("swup-native");
    }), this.hooks.clear();
  }
  shouldIgnoreVisit(t2, { el: e3, event: i3 } = {}) {
    const { origin: s2, url: n2, hash: o3 } = l$1.fromUrl(t2);
    return s2 !== window.location.origin || !(!e3 || !this.triggerWillOpenNewWindow(e3)) || !!this.options.ignoreVisit(n2 + o3, { el: e3, event: i3 });
  }
  handleLinkClick(t2) {
    const e3 = t2.delegateTarget, { href: i3, url: s2, hash: n2 } = l$1.fromElement(e3);
    if (this.shouldIgnoreVisit(i3, { el: e3, event: t2 })) return;
    if (this.navigating && s2 === this.visit.to.url) return void t2.preventDefault();
    const o3 = this.createVisit({ to: s2, hash: n2, el: e3, event: t2 });
    t2.metaKey || t2.ctrlKey || t2.shiftKey || t2.altKey ? this.hooks.callSync("link:newtab", o3, { href: i3 }) : 0 === t2.button && this.hooks.callSync("link:click", o3, { el: e3, event: t2 }, () => {
      var e4;
      const i4 = null != (e4 = o3.from.url) ? e4 : "";
      t2.preventDefault(), s2 && s2 !== i4 ? this.isSameResolvedUrl(s2, i4) || this.performNavigation(o3) : n2 ? this.hooks.callSync("link:anchor", o3, { hash: n2 }, () => {
        r$3(s2 + n2), this.scrollToContent(o3);
      }) : this.hooks.callSync("link:self", o3, void 0, () => {
        "navigate" === this.options.linkToSelf ? this.performNavigation(o3) : (r$3(s2), this.scrollToContent(o3));
      });
    });
  }
  handlePopState(t2) {
    var e3, i3, s2, o3;
    const r2 = null != (e3 = null == (i3 = t2.state) ? void 0 : i3.url) ? e3 : window.location.href;
    if (this.options.skipPopStateHandling(t2)) return;
    if (this.isSameResolvedUrl(n$4(), this.location.url)) return;
    const { url: a2, hash: h2 } = l$1.fromUrl(r2), c2 = this.createVisit({ to: a2, hash: h2, event: t2 });
    c2.history.popstate = true;
    const u2 = null != (s2 = null == (o3 = t2.state) ? void 0 : o3.index) ? s2 : 0;
    u2 && u2 !== this.currentHistoryIndex && (c2.history.direction = u2 - this.currentHistoryIndex > 0 ? "forwards" : "backwards", this.currentHistoryIndex = u2), c2.animation.animate = false, c2.scroll.reset = false, c2.scroll.target = false, this.options.animateHistoryBrowsing && (c2.animation.animate = true, c2.scroll.reset = true), this.hooks.callSync("history:popstate", c2, { event: t2 }, () => {
      this.performNavigation(c2);
    });
  }
  triggerWillOpenNewWindow(t2) {
    return !!t2.matches('[download], [target="_blank"]');
  }
}
function r$2() {
  return r$2 = Object.assign ? Object.assign.bind() : function(r2) {
    for (var n2 = 1; n2 < arguments.length; n2++) {
      var e3 = arguments[n2];
      for (var t2 in e3) Object.prototype.hasOwnProperty.call(e3, t2) && (r2[t2] = e3[t2]);
    }
    return r2;
  }, r$2.apply(this, arguments);
}
const n$3 = (r2) => String(r2).split(".").map((r3) => String(parseInt(r3 || "0", 10))).concat(["0", "0"]).slice(0, 3).join(".");
let e$1 = class e {
  constructor() {
    this.isSwupPlugin = true, this.swup = void 0, this.version = void 0, this.requires = {}, this.handlersToUnregister = [];
  }
  mount() {
  }
  unmount() {
    this.handlersToUnregister.forEach((r2) => r2()), this.handlersToUnregister = [];
  }
  _beforeMount() {
    if (!this.name) throw new Error("You must define a name of plugin when creating a class.");
  }
  _afterUnmount() {
  }
  _checkRequirements() {
    return "object" != typeof this.requires || Object.entries(this.requires).forEach(([r2, e3]) => {
      if (!function(r3, e4, t2) {
        const s2 = function(r4, n2) {
          var e5;
          if ("swup" === r4) return null != (e5 = n2.version) ? e5 : "";
          {
            var t3;
            const e6 = n2.findPlugin(r4);
            return null != (t3 = null == e6 ? void 0 : e6.version) ? t3 : "";
          }
        }(r3, t2);
        return !!s2 && ((r4, e5) => e5.every((e6) => {
          const [, t3, s3] = e6.match(/^([\D]+)?(.*)$/) || [];
          var o3, i3;
          return ((r5, n2) => {
            const e7 = { "": (r6) => 0 === r6, ">": (r6) => r6 > 0, ">=": (r6) => r6 >= 0, "<": (r6) => r6 < 0, "<=": (r6) => r6 <= 0 };
            return (e7[n2] || e7[""])(r5);
          })((i3 = s3, o3 = n$3(o3 = r4), i3 = n$3(i3), o3.localeCompare(i3, void 0, { numeric: true })), t3 || ">=");
        }))(s2, e4);
      }(r2, e3 = Array.isArray(e3) ? e3 : [e3], this.swup)) {
        const n2 = `${r2} ${e3.join(", ")}`;
        throw new Error(`Plugin version mismatch: ${this.name} requires ${n2}`);
      }
    }), true;
  }
  on(r2, n2, e3 = {}) {
    var t2;
    n2 = !(t2 = n2).name.startsWith("bound ") || t2.hasOwnProperty("prototype") ? n2.bind(this) : n2;
    const s2 = this.swup.hooks.on(r2, n2, e3);
    return this.handlersToUnregister.push(s2), s2;
  }
  once(n2, e3, t2 = {}) {
    return this.on(n2, e3, r$2({}, t2, { once: true }));
  }
  before(n2, e3, t2 = {}) {
    return this.on(n2, e3, r$2({}, t2, { before: true }));
  }
  replace(n2, e3, t2 = {}) {
    return this.on(n2, e3, r$2({}, t2, { replace: true }));
  }
  off(r2, n2) {
    return this.swup.hooks.off(r2, n2);
  }
};
function e2() {
  return e2 = Object.assign ? Object.assign.bind() : function(t2) {
    for (var e3 = 1; e3 < arguments.length; e3++) {
      var s2 = arguments[e3];
      for (var n2 in s2) Object.prototype.hasOwnProperty.call(s2, n2) && (t2[n2] = s2[n2]);
    }
    return t2;
  }, e2.apply(this, arguments);
}
function s$2(t2, { prefix: e3 = "" } = {}) {
  return !!t2 && t2.startsWith(e3);
}
function n$2(t2, e3 = []) {
  const s2 = Array.from(t2.attributes);
  return e3.length ? s2.filter(({ name: t3 }) => e3.some((e4) => e4 instanceof RegExp ? e4.test(t3) : t3 === e4)) : s2;
}
let o$3 = class o extends e$1 {
  constructor(t2 = {}) {
    super(), this.name = "SwupBodyClassPlugin", this.requires = { swup: ">=4.6" }, this.defaults = { prefix: "", attributes: [] }, this.options = void 0, this.update = (t3) => {
      const { prefix: e3, attributes: o3 } = this.options;
      !function(t4, e4, { prefix: n2 = "" } = {}) {
        const o4 = [...t4.classList].filter((t5) => s$2(t5, { prefix: n2 })), i3 = [...e4.classList].filter((t5) => s$2(t5, { prefix: n2 }));
        t4.classList.remove(...o4), t4.classList.add(...i3);
      }(document.body, t3.to.document.body, { prefix: e3 }), null != o3 && o3.length && function(t4, e4, s2 = []) {
        const o4 = /* @__PURE__ */ new Set();
        for (const { name: i3, value: r2 } of n$2(e4, s2)) t4.setAttribute(i3, r2), o4.add(i3);
        for (const { name: e5 } of n$2(t4, s2)) o4.has(e5) || t4.removeAttribute(e5);
      }(document.body, t3.to.document.body, o3);
    }, this.options = e2({}, this.defaults, t2);
  }
  mount() {
    this.on("content:replace", this.update);
  }
};
function t() {
  return t = Object.assign ? Object.assign.bind() : function(e3) {
    for (var t2 = 1; t2 < arguments.length; t2++) {
      var s2 = arguments[t2];
      for (var n2 in s2) ({}).hasOwnProperty.call(s2, n2) && (e3[n2] = s2[n2]);
    }
    return e3;
  }, t.apply(null, arguments);
}
function s$1(e3) {
  return "title" !== e3.localName && !e3.matches("[data-swup-theme]");
}
function n$1(e3, t2) {
  return e3.outerHTML === t2.outerHTML;
}
function r$1(e3, t2 = []) {
  const s2 = Array.from(e3.attributes);
  return t2.length ? s2.filter(({ name: e4 }) => t2.some((t3) => t3 instanceof RegExp ? t3.test(e4) : e4 === t3)) : s2;
}
function o$2(e3) {
  return e3.matches("link[rel=stylesheet][href]");
}
let i$1 = class i extends e$1 {
  constructor(e3 = {}) {
    var i3;
    super(), i3 = this, this.name = "SwupHeadPlugin", this.requires = { swup: ">=4.6" }, this.defaults = { persistTags: false, persistAssets: false, awaitAssets: false, attributes: ["lang", "dir"], timeout: 3e3 }, this.options = void 0, this.updateHead = async function(e4, { page: {} }) {
      const { awaitAssets: a2, attributes: l3, timeout: u2 } = i3.options, c2 = e4.to.document, { removed: d2, added: h2 } = function(e5, r2, { shouldPersist: o3 = () => false } = {}) {
        const i4 = Array.from(e5.children), a3 = Array.from(r2.children), l4 = (u3 = i4, a3.reduce((e6, t2, s2) => (u3.some((e7) => n$1(t2, e7)) || e6.push({ el: t2, index: s2 }), e6), []));
        var u3;
        const c3 = function(e6, t2) {
          return e6.reduce((e7, s2) => (t2.some((e8) => n$1(s2, e8)) || e7.push({ el: s2 }), e7), []);
        }(i4, a3);
        c3.reverse().filter(({ el: e6 }) => s$1(e6)).filter(({ el: e6 }) => !o3(e6)).forEach(({ el: t2 }) => e5.removeChild(t2));
        const d3 = l4.filter(({ el: e6 }) => s$1(e6)).map((s2) => {
          let n2 = s2.el.cloneNode(true);
          return e5.insertBefore(n2, e5.children[(s2.index || 0) + 1] || null), t({}, s2, { el: n2 });
        });
        return { removed: c3.map(({ el: e6 }) => e6), added: d3.map(({ el: e6 }) => e6) };
      }(document.head, c2.head, { shouldPersist: (e5) => i3.isPersistentTag(e5) });
      if (i3.swup.log(`Removed ${d2.length} / added ${h2.length} tags in head`), null != l3 && l3.length && function(e5, t2, s2 = []) {
        const n2 = /* @__PURE__ */ new Set();
        for (const { name: o3, value: i4 } of r$1(t2, s2)) e5.setAttribute(o3, i4), n2.add(o3);
        for (const { name: t3 } of r$1(e5, s2)) n2.has(t3) || e5.removeAttribute(t3);
      }(document.documentElement, c2.documentElement, l3), a2) {
        const e5 = function(e6, t2 = 0) {
          return e6.filter(o$2).map((e7) => function(e8, t3 = 0) {
            let s2;
            const n2 = (t4) => {
              e8.sheet ? t4() : s2 = setTimeout(() => n2(t4), 10);
            };
            return new Promise((r2) => {
              n2(() => r2(e8)), t3 > 0 && setTimeout(() => {
                s2 && clearTimeout(s2), r2(e8);
              }, t3);
            });
          }(e7, t2));
        }(h2, u2);
        e5.length && (i3.swup.log(`Waiting for ${e5.length} assets to load`), await Promise.all(e5));
      }
    }, this.options = t({}, this.defaults, e3), this.options.persistAssets && !this.options.persistTags && (this.options.persistTags = "link[rel=stylesheet], script[src], style");
  }
  mount() {
    this.before("content:replace", this.updateHead);
  }
  isPersistentTag(e3) {
    const { persistTags: t2 } = this.options;
    return "function" == typeof t2 ? t2(e3) : "string" == typeof t2 && t2.length > 0 ? e3.matches(t2) : Boolean(t2);
  }
};
function o$1() {
  return o$1 = Object.assign ? Object.assign.bind() : function(t2) {
    for (var n2 = 1; n2 < arguments.length; n2++) {
      var i3 = arguments[n2];
      for (var o3 in i3) Object.prototype.hasOwnProperty.call(i3, o3) && (t2[o3] = i3[o3]);
    }
    return t2;
  }, o$1.apply(this, arguments);
}
const a$1 = { from: "(.*)", to: "(.*)", out: (t2) => t2(), in: (t2) => t2() };
class s extends e$1 {
  constructor(t2) {
    var i3, s2;
    super(), i3 = this, this.name = "SwupJsPlugin", this.requires = { swup: ">=4" }, this.defaults = { animations: [], matchOptions: {} }, this.options = void 0, this.animations = [], this.awaitOutAnimation = async function(t3, { skip: n2 }) {
      n2 || await i3.findAndRunAnimation(t3, "out");
    }, this.awaitInAnimation = async function(t3, { skip: n2 }) {
      n2 || await i3.findAndRunAnimation(t3, "in");
    }, Array.isArray(t2) && (t2 = { animations: t2 }), this.options = o$1({}, this.defaults, t2), this.options.animations.push(a$1), this.animations = (s2 = this.options.matchOptions, this.options.animations.map((t3) => function(t4, i4) {
      return o$1({}, t4, { matchesFrom: h(t4.from, i4), matchesTo: h(t4.to, i4) });
    }(t3, s2)));
  }
  mount() {
    this.replace("animation:out:await", this.awaitOutAnimation, { priority: -1 }), this.replace("animation:in:await", this.awaitInAnimation, { priority: -1 });
  }
  async findAndRunAnimation(t2, n2) {
    const o3 = function(t3, n3) {
      return function(t4, n4, i3, o4) {
        let a2 = 0;
        const s2 = t4.reduceRight((t5, s3) => {
          const r2 = function(t6, n5, i4, o5) {
            let a3 = 0;
            const s4 = t6.matchesFrom(n5);
            return s4 && (a3 += 1), t6.matchesTo(i4) && (a3 += 1), s4 && t6.to === o5 && (a3 += 2), a3;
          }(s3, n4, i3, o4);
          return r2 >= a2 ? (a2 = r2, s3) : t5;
        }, null);
        return s2;
      }(t3, n3.from.url, n3.to.url, n3.animation.name);
    }(this.animations, t2);
    if (o3) {
      const a2 = function(t3, n3, i3) {
        const o4 = t3.matchesFrom(n3.from.url), a3 = t3.matchesTo(n3.to.url);
        return { visit: n3, direction: i3, from: { url: n3.from.url, pattern: t3.from, params: o4 ? o4.params : {} }, to: { url: n3.to.url, pattern: t3.to, params: a3 ? a3.params : {} } };
      }(o3, t2, n2);
      await function(t3, n3) {
        const { direction: o4 } = n3, a3 = t3[o4];
        return a3 ? new Promise((t4) => {
          const o5 = a3(() => t4(), n3);
          f(o5) && o5.then(t4);
        }) : (console.warn(`Missing animation function for '${o4}' phase`), Promise.resolve());
      }(o3, a2);
    }
  }
}
function r() {
  return r = Object.assign ? Object.assign.bind() : function(e3) {
    for (var t2 = 1; t2 < arguments.length; t2++) {
      var s2 = arguments[t2];
      for (var r2 in s2) ({}).hasOwnProperty.call(s2, r2) && (e3[r2] = s2[r2]);
    }
    return e3;
  }, r.apply(null, arguments);
}
function o2() {
  return window.matchMedia("(hover: hover)").matches;
}
function i2(e3) {
  return !!e3 && (e3 instanceof HTMLAnchorElement || e3 instanceof SVGAElement);
}
const n = window.requestIdleCallback || ((e3) => setTimeout(e3, 1)), a = ["preloadVisibleLinks"];
class l2 extends e$1 {
  constructor(e3 = {}) {
    var s2;
    super(), s2 = this, this.name = "SwupPreloadPlugin", this.requires = { swup: ">=4.5" }, this.defaults = { throttle: 5, preloadInitialPage: true, preloadHoveredLinks: true, preloadVisibleLinks: { enabled: false, threshold: 0.2, delay: 500, containers: ["body"], ignore: () => false } }, this.options = void 0, this.queue = void 0, this.preloadObserver = void 0, this.preloadPromises = /* @__PURE__ */ new Map(), this.mouseEnterDelegate = void 0, this.touchStartDelegate = void 0, this.focusDelegate = void 0, this.onPageLoad = (e4, t2, s3) => {
      const { url: r2 } = e4.to;
      return r2 && this.preloadPromises.has(r2) ? this.preloadPromises.get(r2) : s3(e4, t2);
    }, this.onMouseEnter = async function(e4) {
      if (e4.target !== e4.delegateTarget) return;
      if (!o2()) return;
      const r2 = e4.delegateTarget;
      if (!i2(r2)) return;
      const { url: n3, hash: a2 } = l$1.fromElement(r2), l4 = s2.swup.createVisit({ to: n3, hash: a2, el: r2, event: e4 });
      s2.swup.hooks.callSync("link:hover", l4, { el: r2, event: e4 }), s2.preload(r2, { priority: true });
    }, this.onTouchStart = (e4) => {
      if (o2()) return;
      const t2 = e4.delegateTarget;
      i2(t2) && this.preload(t2, { priority: true });
    }, this.onFocus = (e4) => {
      const t2 = e4.delegateTarget;
      i2(t2) && this.preload(t2, { priority: true });
    };
    const { preloadVisibleLinks: n2 } = e3, l3 = function(e4, t2) {
      if (null == e4) return {};
      var s3 = {};
      for (var r2 in e4) if ({}.hasOwnProperty.call(e4, r2)) {
        if (t2.includes(r2)) continue;
        s3[r2] = e4[r2];
      }
      return s3;
    }(e3, a);
    this.options = r({}, this.defaults, l3), "object" == typeof n2 ? this.options.preloadVisibleLinks = r({}, this.options.preloadVisibleLinks, { enabled: true }, n2) : this.options.preloadVisibleLinks.enabled = Boolean(n2), this.preload = this.preload.bind(this), this.queue = /* @__PURE__ */ function(e4 = 1) {
      const t2 = [], s3 = [];
      let r2 = 0, o3 = 0;
      function i3() {
        o3 < e4 && r2 > 0 && ((s3.shift() || t2.shift() || (() => {
        }))(), r2--, o3++);
      }
      return { add: function(e5, o4 = false) {
        if (e5.__queued) {
          if (!o4) return;
          {
            const s4 = t2.indexOf(e5);
            if (s4 >= 0) {
              const e6 = t2.splice(s4, 1);
              r2 -= e6.length;
            }
          }
        }
        e5.__queued = true, (o4 ? s3 : t2).push(e5), r2++, r2 <= 1 && i3();
      }, next: function() {
        o3--, i3();
      } };
    }(this.options.throttle);
  }
  mount() {
    const e3 = this.swup;
    e3.options.cache ? (e3.hooks.create("page:preload"), e3.hooks.create("link:hover"), e3.preload = this.preload, e3.preloadLinks = this.preloadLinks, this.replace("page:load", this.onPageLoad), this.preloadLinks(), this.on("page:view", () => this.preloadLinks()), this.options.preloadVisibleLinks.enabled && (this.preloadVisibleLinks(), this.on("page:view", () => this.preloadVisibleLinks())), this.options.preloadHoveredLinks && this.preloadLinksOnAttention(), this.options.preloadInitialPage && this.preload(n$4())) : console.warn("SwupPreloadPlugin: swup cache needs to be enabled for preloading");
  }
  unmount() {
    var e3, t2, s2;
    this.swup.preload = void 0, this.swup.preloadLinks = void 0, this.preloadPromises.clear(), null == (e3 = this.mouseEnterDelegate) || e3.destroy(), null == (t2 = this.touchStartDelegate) || t2.destroy(), null == (s2 = this.focusDelegate) || s2.destroy(), this.stopPreloadingVisibleLinks();
  }
  async preload(e3, s2 = {}) {
    var r2;
    let o3, n2;
    const a2 = null != (r2 = s2.priority) && r2;
    if (Array.isArray(e3)) return Promise.all(e3.map((e4) => this.preload(e4)));
    if (i2(e3)) n2 = e3, { href: o3 } = l$1.fromElement(e3);
    else {
      if ("string" != typeof e3) return;
      o3 = e3;
    }
    if (!o3) return;
    if (this.swup.cache.has(o3)) return this.swup.cache.get(o3);
    if (this.preloadPromises.has(o3)) return this.preloadPromises.get(o3);
    if (!this.shouldPreload(o3, { el: n2 })) return;
    const l3 = new Promise((e4) => {
      this.queue.add(() => {
        this.performPreload(o3).catch(() => {
        }).then((t2) => e4(t2)).finally(() => {
          this.queue.next(), this.preloadPromises.delete(o3);
        });
      }, a2);
    });
    return this.preloadPromises.set(o3, l3), l3;
  }
  preloadLinks() {
    n(() => {
      Array.from(document.querySelectorAll("a[data-swup-preload], [data-swup-preload-all] a")).forEach((e3) => this.preload(e3));
    });
  }
  preloadLinksOnAttention() {
    const { swup: e3 } = this, { linkSelector: t2 } = e3.options, s2 = { passive: true, capture: true };
    this.mouseEnterDelegate = e3.delegateEvent(t2, "mouseenter", this.onMouseEnter, s2), this.touchStartDelegate = e3.delegateEvent(t2, "touchstart", this.onTouchStart, s2), this.focusDelegate = e3.delegateEvent(t2, "focus", this.onFocus, s2);
  }
  preloadVisibleLinks() {
    if (this.preloadObserver) return void this.preloadObserver.update();
    const { threshold: e3, delay: s2, containers: r2 } = this.options.preloadVisibleLinks;
    this.preloadObserver = function({ threshold: e4, delay: s3, containers: r3, callback: o3, filter: i3 }) {
      const a2 = /* @__PURE__ */ new Map(), l3 = new IntersectionObserver((e5) => {
        e5.forEach((e6) => {
          e6.isIntersecting ? h2(e6.target) : u2(e6.target);
        });
      }, { threshold: e4 }), h2 = (e5) => {
        var r4;
        const { href: i4 } = l$1.fromElement(e5), n2 = null != (r4 = a2.get(i4)) ? r4 : /* @__PURE__ */ new Set();
        a2.set(i4, n2), n2.add(e5), setTimeout(() => {
          const t2 = a2.get(i4);
          null != t2 && t2.size && (o3(e5), l3.unobserve(e5), t2.delete(e5));
        }, s3);
      }, u2 = (e5) => {
        var s4;
        const { href: r4 } = l$1.fromElement(e5);
        null == (s4 = a2.get(r4)) || s4.delete(e5);
      }, d2 = () => {
        n(() => {
          const e5 = r3.map((e6) => `${e6} a[*|href]`).join(", ");
          Array.from(document.querySelectorAll(e5)).filter((e6) => i3(e6)).forEach((e6) => l3.observe(e6));
        });
      };
      return { start: () => d2(), stop: () => l3.disconnect(), update: () => (a2.clear(), d2()) };
    }({ threshold: e3, delay: s2, containers: r2, callback: (e4) => this.preload(e4), filter: (e4) => {
      if (this.options.preloadVisibleLinks.ignore(e4)) return false;
      if (!e4.matches(this.swup.options.linkSelector)) return false;
      const { href: s3 } = l$1.fromElement(e4);
      return this.shouldPreload(s3, { el: e4 });
    } }), this.preloadObserver.start();
  }
  stopPreloadingVisibleLinks() {
    this.preloadObserver && this.preloadObserver.stop();
  }
  shouldPreload(e3, { el: r2 } = {}) {
    const { url: o3, href: i3 } = l$1.fromUrl(e3);
    return !(!function() {
      if (navigator.connection) {
        var e4;
        if (navigator.connection.saveData) return false;
        if (null != (e4 = navigator.connection.effectiveType) && e4.endsWith("2g")) return false;
      }
      return true;
    }() || this.swup.cache.has(o3) || this.preloadPromises.has(o3) || this.swup.shouldIgnoreVisit(i3, { el: r2 }) || r2 && this.swup.resolveUrl(o3) === this.swup.resolveUrl(n$4()));
  }
  async performPreload(e3) {
    var s2 = this;
    const { url: r2 } = l$1.fromUrl(e3), o3 = this.swup.createVisit({ to: r2 }), i3 = await this.swup.hooks.call("page:preload", o3, { url: r2 }, async function(t2, r3) {
      return r3.page = await s2.swup.fetchPage(e3, { visit: t2 }), r3.page;
    });
    return i3;
  }
}
if (!window.__swupMinimalLoaded) {
  window.__swupMinimalLoaded = true;
  console.log("vite main loaded");
}
var origin = window.location.origin;
var linkSelector = 'a[href^="/"]:not([target="_blank"]):not([data-no-swup]):not([download]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href*="/wp-admin"]):not([href*="/wp-login.php"]), a[href^="' + origin + '"]:not([target="_blank"]):not([data-no-swup]):not([download]):not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"]):not([href*="/wp-admin"]):not([href*="/wp-login.php"])';
function isSameOrigin(link) {
  return link.origin === window.location.origin;
}
function shouldHandleLink(link) {
  if (!link || link.tagName !== "A") {
    return false;
  }
  if (!link.href) {
    return false;
  }
  if (!isSameOrigin(link)) {
    return false;
  }
  if (link.target === "_blank") {
    return false;
  }
  if (link.hasAttribute("data-no-swup")) {
    return false;
  }
  if (link.hasAttribute("download")) {
    return false;
  }
  if (link.getAttribute("href") && link.getAttribute("href").charAt(0) === "#") {
    return false;
  }
  if (link.href.indexOf("mailto:") === 0 || link.href.indexOf("tel:") === 0) {
    return false;
  }
  if (link.href.indexOf("/wp-admin") !== -1 || link.href.indexOf("/wp-login.php") !== -1) {
    return false;
  }
  return true;
}
function initPage() {
  if (!window.__swupMinimalGuardInstalled) {
    window.__swupMinimalGuardInstalled = true;
    document.addEventListener("click", function(event) {
      var link = event.target.closest("a");
      if (!shouldHandleLink(link)) {
        event.stopImmediatePropagation();
      }
    }, true);
  }
}
function animateMain(target, keyframes, options) {
  if (!target || typeof target.animate !== "function") {
    return Promise.resolve();
  }
  target.style.willChange = "opacity, transform";
  var animation = target.animate(keyframes, options);
  return animation.finished.catch(function() {
  }).then(function() {
    target.style.willChange = "";
  });
}
function getTransitionLayer() {
  var layer = document.getElementById("swup-transition-layer");
  if (layer) {
    return layer;
  }
  layer = document.createElement("div");
  layer.id = "swup-transition-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.style.position = "fixed";
  layer.style.inset = "0";
  layer.style.zIndex = "9999";
  layer.style.pointerEvents = "none";
  layer.style.background = "linear-gradient(180deg, #0b56f0 0%, #0a1124 100%)";
  layer.style.transform = "translateY(100%)";
  layer.style.willChange = "transform";
  document.body.appendChild(layer);
  return layer;
}
function animateLayer(layer, keyframes, options) {
  if (!layer || typeof layer.animate !== "function") {
    return Promise.resolve();
  }
  var animation = layer.animate(keyframes, options);
  return animation.finished.catch(function() {
  });
}
if (!window.__swupMinimalInstance) {
  window.__swupMinimalInstance = new _({
    containers: ["#swup"],
    linkSelector,
    animationSelector: ".swup-transition",
    plugins: [
      new o$3(),
      new i$1(),
      new s({
        animations: [
          {
            from: "(.*)",
            to: "(.*)",
            out: function() {
              var layer = getTransitionLayer();
              var main = document.querySelector("#swup");
              var layerIn = animateLayer(layer, [
                { transform: "translateY(100%)" },
                { transform: "translateY(0%)" }
              ], {
                duration: 520,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards"
              });
              var mainOut = animateMain(main, [
                { opacity: 1, transform: "translateY(0) scale(1)" },
                { opacity: 0.8, transform: "translateY(8px) scale(0.998)" }
              ], {
                duration: 300,
                easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                fill: "forwards"
              });
              return Promise.all([layerIn, mainOut]);
            },
            in: function() {
              var layer = getTransitionLayer();
              var main = document.querySelector("#swup");
              if (main) {
                main.style.opacity = "1";
                main.style.transform = "translateY(0) scale(1)";
              }
              return animateLayer(layer, [
                { transform: "translateY(0%)" },
                { transform: "translateY(-100%)" }
              ], {
                duration: 560,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards"
              }).then(function() {
                layer.style.transform = "translateY(100%)";
              });
            }
          }
        ]
      }),
      new l2()
    ]
  });
  console.log("swup initialized");
  window.__swupMinimalInstance.hooks.on("content:replace", function() {
    console.log("swup content replaced");
    initPage();
    document.dispatchEvent(new CustomEvent("swup:replaced"));
    console.log("page view", window.location.pathname);
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: window.location.pathname
      });
    }
  });
}
initPage();
//# sourceMappingURL=main.js.map
