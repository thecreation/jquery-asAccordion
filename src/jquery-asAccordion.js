/*
 * asAccordion
 * https://github.com/amazingSurge/jquery-asAccordion
 *
 * Copyright (c) 2014 amazingSurge
 * Licensed under the MIT license.
 */

(function(window, document, $, undefined) {
    "use strict";

    var pluginName = 'asAccordion';

    var Util = {
        transition: function() {
            var e,
                end,
                prefix = '',
                supported = false,
                el = document.createElement("fakeelement"),
                transitions = {
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
    };

    // main constructor
    var Plugin = $[pluginName] = function(element, options) {
        this.element = element;
        this.$element = $(element);

        this.options = $.extend({}, Plugin.defaults, options, this.$element.data());

        this._plugin = pluginName;
        this.namespace = this.options.namespace;
        this.initialIndex = this.options.initialIndex;
        this.initialized = false;
        this.disabled = false;
        this.actived = false;
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

        this.transition = Util.transition();

        this._trigger('init');
        this.init();
    };

    Plugin.prototype = {
        constructor: Plugin,

        init: function() {
            var self = this;
            var style = {};

            this.distance = this.$heading.outerHeight();
            if (this.options.direction === 'vertical') {
                this.animateProperty = 'height';
            } else {
                this.animateProperty = 'width';
            }

            style[this.animateProperty] = this.distance;

            this.$panel.css(style);

            this.$heading.on(this.options.event, function(e) {
                if (self.disabled) {
                    return false;
                }

                var index = $(e.currentTarget).parent().index();
                self.set(index);
                return false;
            });

            this.set(this.initialIndex);
            this.current = this.initialIndex;

            this.responsive.init(this);
            $(window).on('resize', this._throttle(function(){
                self.responsive.init(self);
            }, 250));


            this.initialized = true;

            this._trigger('ready');
        },

        _trigger: function(eventType) {
            var method_arguments = Array.prototype.slice.call(arguments, 1),
                data = [this].concat(method_arguments);
            
            // event
            this.$element.trigger('asAccordion::' + eventType, data);

            // callback
            eventType = eventType.replace(/\b\w+\b/g, function(word) {
                return word.substring(0, 1).toUpperCase() + word.substring(1);
            });
            var onFunction = 'on' + eventType;
            if (typeof this.options[onFunction] === 'function') {
                this.options[onFunction].apply(this, method_arguments);
            }
        },

        responsive: {
            init: function(self) {
                if ($('html, body').outerWidth() <= self.options.mobile_breakpoint) {
                    if (self.options.direction === 'vertical') {
                        return false;
                    }

                    this.resize(self);
                }else {
                    if (typeof self.default_direction === 'undefined' || self.default_direction === 'vertical') {
                        return false;
                    }

                    this.resize(self);
                }
            },
            resize: function(self) {
                var style = {};
                self.default_direction = self.options.direction;
                if (self.options.direction === 'vertical') {
                    self.options.direction = 'horizontal';
                    self.animateProperty = 'width';
                    self.$panel.css('height', '100%');
                }else {
                    self.options.direction = 'vertical';
                    self.animateProperty = 'height';
                    self.$panel.css('width', 'auto');
                }

                self.$element.removeClass(self.classes.direction);
                self.classes.direction = self.namespace + '--' + self.options.direction;
                self.$element.addClass(self.classes.direction);
                
                style[self.animateProperty] = self.distance;
                self.$panel.css(style);

                if (typeof self.current !== 'undefined') {
                    var index = self.current;
                    self.current = null;
                    self.set(index);
                }
            }
        },

        set: function(index) {
            var self = this,
                $panel = this.$panel.eq(index),
                $oldPanel = this.$element.find('.' + this.classes.active),
                distance,
                duration,
                style = {},
                old_style = {};

            var moveEnd = function() {
                if (typeof callback === 'function') {
                    callback.call(self);
                }

                self.$element.trigger('moveEnd');
            };

            if (typeof duration === 'undefined') {
                duration = this.options.speed;
            }
            duration = Math.ceil(duration);

            if (index === this.current) {
                this.current = null;
                distance = this.distance;
                $panel.removeClass(this.classes.active);
            }else {
                if (index >= this.size) {
                    index = this.size - 1;
                }else if (index < 0) {
                    index = 0;
                }

                if (this.options.direction === 'vertical') {
                    distance = $panel.find('.' + this.namespace + '__expander').outerHeight() + this.distance;
                } else {
                    distance = $panel.find('.' + this.namespace + '__expander').outerWidth() + this.distance;
                }

                this.current = index;

                old_style[this.animateProperty] = this.distance;  // used to remove the original distance
                this.animate($oldPanel, old_style, duration, this.options.easing, moveEnd);

                $panel.addClass(this.classes.active).siblings().removeClass(this.classes.active);
            }

            style[this.animateProperty] = distance;

            this.animate($panel, style, duration, self.options.easing, moveEnd);
        },

        animate: function($el, properties, duration, easing, callback) {
            var self = this;

            if(this.transition.supported){
                window.setTimeout(function() {
                    self.insertRule('.transition_' + easing + ' {' + self.transition.prefix + 'transition: all ' + duration + 'ms ' + easing + ' 0s;}');

                    $el.addClass('transition_' + easing).one(self.transition.end, function() {
                        $el.removeClass('transition_' + easing);

                        callback.call(this);
                    });
                    $el.css(properties);
                }, 10);
            } else {
                $el.animate(properties, duration, easing, callback);
            }
        },

        insertRule: function(rule) {
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
        },




        /**
         * _throttle
         * @description Borrowed from Underscore.js
         */
        _throttle: function(func, wait) {
            var _now = Date.now || function() {
                return new Date().getTime();
            };
            var context, args, result;
            var timeout = null;
            var previous = 0;
            var later = function() {
                previous = _now();
                timeout = null;
                result = func.apply(context, args);
                context = args = null;
            };
            return function() {
                var now = _now();
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0) {
                    clearTimeout(timeout);
                    timeout = null;
                    previous = now;
                    result = func.apply(context, args);
                    context = args = null;
                } else if (!timeout) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },

        enable: function() {
            this.disabled = false;
            this.$element.removeClass(this.classes.disabled);
        },

        disable: function() {
            this.disabled = true;
            this.$element.addClass(this.classes.disabled);
        },

        destory: function() {
            this.$element.data(pluginName, null);
            this.$element.remove();
            this._trigger('destory');
        }
    };

    Plugin.defaults = {
        namespace: pluginName,
        skin: null,
        mobile_breakpoint: 768,
        initialIndex: 0,
        easing: 'ease-in-out',
        speed: 500,
        direction: 'vertical',
        event: 'click'
    };

    $.fn[pluginName] = function(options) {
        if (typeof options === 'string') {
            var method = options;
            var method_arguments = Array.prototype.slice.call(arguments, 1);

            if (/^\_/.test(method)) {
                return false;
            } else if ((method === 'get')) {
                var api = this.first().data(pluginName);
                if (api && typeof api[method] === 'function') {
                    return api[method].apply(api, method_arguments);
                }
            } else {
                return this.each(function() {
                    var api = $.data(this, pluginName);
                    if (api && typeof api[method] === 'function') {
                        api[method].apply(api, method_arguments);
                    }
                });
            }
        } else {
            return this.each(function() {
                if (!$.data(this, pluginName)) {
                    $.data(this, pluginName, new Plugin(this, options));
                }
            });
        }
    };
}(window, document, jQuery));
