/**
* jQuery asAccordion v0.2.1
* https://github.com/amazingSurge/jquery-asAccordion
*
* Copyright (c) amazingSurge
* Released under the LGPL-3.0 license
*/
(function(global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['jquery'], factory);
  } else if (typeof exports !== "undefined") {
    factory(require('jquery'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.jQuery);
    global.jqueryAsAccordionEs = mod.exports;
  }
})(this,

  function(_jquery) {
    'use strict';

    var _jquery2 = _interopRequireDefault(_jquery);

    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : {
        default: obj
      };
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ?

      function(obj) {
        return typeof obj;
      }
      :

      function(obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    var _createClass = function() {
      function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;

          if ("value" in descriptor)
            descriptor.writable = true;
          Object.defineProperty(target, descriptor.key, descriptor);
        }
      }

      return function(Constructor, protoProps, staticProps) {
        if (protoProps)
          defineProperties(Constructor.prototype, protoProps);

        if (staticProps)
          defineProperties(Constructor, staticProps);

        return Constructor;
      };
    }();

    var DEFAULTS = {
      namespace: 'accordion',
      skin: null,
      mobileBreakpoint: 768,
      initialIndex: 0,
      easing: 'ease-in-out',
      speed: 500,
      direction: 'vertical',
      event: 'click',
      multiple: false
    };

    function transition() {
      var e = void 0;
      var end = void 0;
      var prefix = '';
      var supported = false;
      var el = document.createElement("fakeelement");

      var transitions = {
        "WebkitTransition": "webkitTransitionEnd",
        "MozTransition": "transitionend",
        "OTransition": "oTransitionend",
        "transition": "transitionend"
      };

      for (e in transitions) {

        if (el.style[e] !== undefined) {
          end = transitions[e];
          supported = true;
          break;
        }
      }

      if (/(WebKit)/i.test(window.navigator.userAgent)) {
        prefix = '-webkit-';
      }

      return {
        prefix: prefix,
        end: end,
        supported: supported
      };
    }

    function throttle(func, wait) {
      var _this = this;

      var _now = Date.now ||

      function() {
        return new Date().getTime();
      };

      var timeout = void 0;
      var context = void 0;
      var args = void 0;
      var result = void 0;
      var previous = 0;
      var later = function later() {
        previous = _now();
        timeout = null;
        result = func.apply(context, args);

        if (!timeout) {
          context = args = null;
        }
      };

      return function() {
        for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
          params[_key] = arguments[_key];
        }

        /*eslint consistent-this: "off"*/
        var now = _now();
        var remaining = wait - (now - previous);
        context = _this;
        args = params;

        if (remaining <= 0 || remaining > wait) {

          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);

          if (!timeout) {
            context = args = null;
          }
        } else if (!timeout) {
          timeout = setTimeout(later, remaining);
        }

        return result;
      };
    }

    var NAMESPACE$1 = 'asAccordion';

    /**
     * Plugin constructor
     **/

    var asAccordion = function() {
      function asAccordion(element, options) {
        _classCallCheck(this, asAccordion);

        this.element = element;
        this.$element = (0, _jquery2.default)(element);

        this.options = _jquery2.default.extend({}, DEFAULTS, options, this.$element.data());

        this.namespace = this.options.namespace;
        this.initialIndex = this.options.initialIndex;
        this.initialized = false;
        this.disabled = false;
        this.current = null;

        this.classes = {
          // status
          skin: this.namespace + '--' + this.options.skin,
          direction: this.namespace + '--' + this.options.direction,
          active: this.namespace + '--active',
          disabled: this.namespace + '--disabled'
        };

        this.$panel = this.$element.children('li');
        this.$heading = this.$panel.children('span');
        this.$expander = this.$panel.children('div');

        this.size = this.$panel.length;

        this.$element.addClass(this.classes.direction);
        this.$panel.addClass(this.namespace + '__panel');
        this.$heading.addClass(this.namespace + '__heading');
        this.$expander.addClass(this.namespace + '__expander');

        if (this.options.skin) {
          this.$element.addClass(this.classes.skin);
        }

        this.transition = transition();

        this._trigger('init');
        this.init();
      }

      _createClass(asAccordion, [{
        key: 'init',
        value: function init() {
          var _this2 = this;

          var style = {};

          this.distance = this.$heading.outerHeight();

          if (this.options.direction === 'vertical') {
            this.animateProperty = 'height';
          } else {
            this.animateProperty = 'width';
          }

          style[this.animateProperty] = this.distance;

          this.$panel.css(style);

          this.$heading.on(this.options.event,

            function(e) {
              if (_this2.disabled) {

                return false;
              }

              var index = (0, _jquery2.default)(e.currentTarget).parent().index();
              _this2.set(index);

              return false;
            }
          );

          this.set(this.initialIndex);
          this.current = this.initialIndex;

          this.initialized = true;

          this.responsiveCheck();

          (0, _jquery2.default)(window).on('resize', throttle(

            function() {
              _this2.responsiveCheck();
            }
            , 250));

          this._trigger('ready');
        }
      }, {
        key: 'responsiveCheck',
        value: function responsiveCheck() {
          if ((0, _jquery2.default)('html, body').outerWidth() <= this.options.mobileBreakpoint && !this.responsive) {

            if (this.options.direction === 'vertical') {

              return;
            }
            this.responsive = true;

            this.resize();
          } else {

            if (typeof this.defaultDirection === 'undefined' || this.defaultDirection === 'vertical') {

              return;
            }
            this.responsive = false;

            this.resize();
          }
        }
      }, {
        key: 'resize',
        value: function resize() {
          var style = {};
          this.defaultDirection = this.options.direction;

          if (this.options.direction === 'vertical') {
            this.options.direction = 'horizontal';
            this.animateProperty = 'width';
            this.$panel.css('height', '100%');
          } else {
            this.options.direction = 'vertical';
            this.animateProperty = 'height';
            this.$panel.css('width', 'auto');
          }

          this.$element.removeClass(this.classes.direction);
          this.classes.direction = this.namespace + '--' + this.options.direction;
          this.$element.addClass(this.classes.direction);

          style[this.animateProperty] = this.distance;
          this.$panel.css(style).removeClass(this.classes.active);

          if (this.current.length >= 0 || this.current >= 0) {
            var index = this.current;
            this.current = this.current.length >= 0 ? [] : null;
            this.set(index);
          }
        }
      }, {
        key: 'set',
        value: function set(index) {
          var _this3 = this;

          if (_jquery2.default.isArray(index)) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {

              for (var _iterator = index[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var i = _step.value;

                this.set(i);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {

                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          } else {
            var key;

            var _ret = function() {
              if (index >= _this3.size || index < 0) {

                return {
                  v: void 0
                };
              }

              var that = _this3;
              var $panel = _this3.$panel.eq(index);
              var $oldPanel = _this3.$element.find('.' + _this3.classes.active);
              var distance = void 0;
              var duration = void 0;
              var style = {};
              var oldStyle = {};

              var moveEnd = function moveEnd() {
                that.$element.trigger('moveEnd');
              };

              if (typeof duration === 'undefined') {
                duration = _this3.options.speed;
              }
              duration = Math.ceil(duration);

              if ($panel.hasClass(_this3.classes.active)) {
                distance = _this3.distance;
                $panel.removeClass(_this3.classes.active);

                if (_this3.options.multiple) {
                  var number = void 0;

                  for (key in _this3.current) {

                    if (_this3.current[key] === index) {
                      number = key;
                    } else {
                      continue;
                    }
                    _this3.current.splice(key, 1);
                  }
                } else {
                  _this3.current = null;
                }
              } else {

                if (_this3.options.direction === 'vertical') {
                  distance = $panel.find('.' + _this3.namespace + '__expander').outerHeight() + _this3.distance;
                } else {
                  distance = $panel.find('.' + _this3.namespace + '__expander').outerWidth() + _this3.distance;
                }

                if (_this3.options.multiple && _jquery2.default.isArray(_this3.current)) {
                  _this3.current.push(index);
                } else {
                  _this3.current = index;
                }

                if (_this3.options.multiple) {
                  $panel.addClass(_this3.classes.active);
                } else {
                  oldStyle[_this3.animateProperty] = _this3.distance; // used to remove the original distance
                  _this3.animate($oldPanel, oldStyle, duration, _this3.options.easing, moveEnd);

                  $panel.addClass(_this3.classes.active).siblings().removeClass(_this3.classes.active);
                }
              }

              style[_this3.animateProperty] = distance;

              _this3.animate($panel, style, duration, _this3.options.easing, moveEnd);
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object")

              return _ret.v;
          }
        }
      }, {
        key: 'animate',
        value: function animate($el, properties, duration, easing, callback) {
          var that = this;

          if (this.transition.supported) {
            window.setTimeout(

              function() {
                that.insertRule('.transition_' + easing + ' {' + that.transition.prefix + 'transition: all ' + duration + 'ms ' + easing + ' 0s;}');

                $el.addClass('transition_' + easing).one(that.transition.end,

                  function() {
                    $el.removeClass('transition_' + easing);

                    callback.call(this);
                  }
                );
                $el.css(properties);
              }
              , 10);
          } else {
            $el.animate(properties, duration, easing, callback);
          }
        }
      }, {
        key: 'insertRule',
        value: function insertRule(rule) {
          if (this.rules && this.rules[rule]) {

            return;
          } else if (this.rules === undefined) {
            this.rules = {};
          } else {
            this.rules[rule] = true;
          }

          if (document.styleSheets && document.styleSheets.length) {
            document.styleSheets[0].insertRule(rule, 0);
          } else {
            var style = document.createElement('style');
            style.innerHTML = rule;
            document.head.appendChild(style);
          }
        }
      }, {
        key: '_trigger',
        value: function _trigger(eventType) {
          for (var _len2 = arguments.length, params = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            params[_key2 - 1] = arguments[_key2];
          }

          var data = [this].concat(params);

          // event
          this.$element.trigger(NAMESPACE$1 + '::' + eventType, data);

          // callback
          eventType = eventType.replace(/\b\w+\b/g,

            function(word) {
              return word.substring(0, 1).toUpperCase() + word.substring(1);
            }
          );
          var onFunction = 'on' + eventType;

          if (typeof this.options[onFunction] === 'function') {
            this.options[onFunction].apply(this, params);
          }
        }
      }, {
        key: 'enable',
        value: function enable() {
          this.disabled = false;
          this.$element.removeClass(this.classes.disabled);
          this._trigger('enable');
        }
      }, {
        key: 'disable',
        value: function disable() {
          this.disabled = true;
          this.$element.addClass(this.classes.disabled);
          this._trigger('disable');
        }
      }, {
        key: 'destroy',
        value: function destroy() {
          this.$element.data(NAMESPACE$1, null);
          this.$element.remove();
          this._trigger('destroy');
        }
      }], [{
        key: 'setDefaults',
        value: function setDefaults(options) {
          _jquery2.default.extend(DEFAULTS, _jquery2.default.isPlainObject(options) && options);
        }
      }]);

      return asAccordion;
    }();

    var info = {
      version: '0.2.1'
    };

    var NAMESPACE = 'asAccordion';
    var OtherAsAccordion = _jquery2.default.fn.asAccordion;

    var jQueryAsAccordion = function jQueryAsAccordion(options) {
      var _this4 = this;

      for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        args[_key3 - 1] = arguments[_key3];
      }

      if (typeof options === 'string') {
        var _ret2 = function() {
          var method = options;

          if (/^_/.test(method)) {

            return {
              v: false
            };
          } else if (/^(get)/.test(method)) {
            var instance = _this4.first().data(NAMESPACE);

            if (instance && typeof instance[method] === 'function') {

              return {
                v: instance[method].apply(instance, args)
              };
            }
          } else {

            return {
              v: _this4.each(

                function() {
                  var instance = _jquery2.default.data(this, NAMESPACE);

                  if (instance && typeof instance[method] === 'function') {
                    instance[method].apply(instance, args);
                  }
                }
              )
            };
          }
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object")

          return _ret2.v;
      }

      return this.each(

        function() {
          if (!(0, _jquery2.default)(this).data(NAMESPACE)) {
            (0, _jquery2.default)(this).data(NAMESPACE, new asAccordion(this, options));
          }
        }
      );
    };

    _jquery2.default.fn.asAccordion = jQueryAsAccordion;

    _jquery2.default.asAccordion = _jquery2.default.extend({
      setDefaults: asAccordion.setDefaults,
      noConflict: function noConflict() {
        _jquery2.default.fn.asAccordion = OtherAsAccordion;

        return jQueryAsAccordion;
      }
    }, info);
  }
);