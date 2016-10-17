import $ from 'jquery';
import DEFAULTS from './defaults';
import * as util from './util';

const NAMESPACE = 'asAccordion';

/**
 * Plugin constructor
 **/
class asAccordion {
  constructor(element, options) {
    this.element = element;
    this.$element = $(element);

    this.options = $.extend({}, DEFAULTS, options, this.$element.data());

    this.namespace = this.options.namespace;
    this.initialIndex = this.options.initialIndex;
    this.initialized = false;
    this.disabled = false;
    this.current = null;

    this.classes = {
      // status
      skin: `${this.namespace}--${this.options.skin}`,
      direction: `${this.namespace}--${this.options.direction}`,
      active: `${this.namespace}--active`,
      disabled: `${this.namespace}--disabled`
    };

    this.$panel = this.$element.children('li');
    this.$heading = this.$panel.children('span');
    this.$expander = this.$panel.children('div');

    this.size = this.$panel.length;

    this.$element.addClass(this.classes.direction);
    this.$panel.addClass(`${this.namespace}__panel`);
    this.$heading.addClass(`${this.namespace}__heading`);
    this.$expander.addClass(`${this.namespace}__expander`);

    if (this.options.skin) {
      this.$element.addClass(this.classes.skin);
    }

    this.transition = util.transition();

    this._trigger('init');
    this.init();
  }

  init() {
    const style = {};

    this.distance = this.$heading.outerHeight();
    if (this.options.direction === 'vertical') {
      this.animateProperty = 'height';
    } else {
      this.animateProperty = 'width';
    }

    style[this.animateProperty] = this.distance;

    this.$panel.css(style);

    this.$heading.on(this.options.event, e => {
      if (this.disabled) {
        return false;
      }

      const index = $(e.currentTarget).parent().index();
      this.set(index);
      return false;
    });

    this.set(this.initialIndex);
    this.current = this.initialIndex;

    this.initialized = true;

    this.responsiveCheck();

    $(window).on('resize', util.throttle(() => {
      this.responsiveCheck();
    }, 250));

    this._trigger('ready');
  }

  responsiveCheck() {
    if ($('html, body').outerWidth() <= this.options.mobileBreakpoint && !this.responsive) {
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

  resize() {
    const style = {};
    this.defaultDirection = this.options.direction;
    if (this.options.direction === 'vertical') {
      this.options.direction = 'horizontal';
      this.animateProperty = 'width';
      this.$panel.css('height', '100%');
    }else {
      this.options.direction = 'vertical';
      this.animateProperty = 'height';
      this.$panel.css('width', 'auto');
    }

    this.$element.removeClass(this.classes.direction);
    this.classes.direction = `${this.namespace}--${this.options.direction}`;
    this.$element.addClass(this.classes.direction);

    style[this.animateProperty] = this.distance;
    this.$panel.css(style).removeClass(this.classes.active);

    if (this.current.length >= 0 || this.current >= 0) {
      const index = this.current;
      this.current = this.current.length >= 0? [] : null;
      this.set(index);
    }
  }

  set(index) {
    if ($.isArray(index)) {
      for(let i of index) {
        this.set(i);
      }
    } else {
      if (index >= this.size || index < 0) {
        return;
      }

      const that = this;
      const $panel = this.$panel.eq(index);
      const $oldPanel = this.$element.find(`.${this.classes.active}`);
      let distance;
      let duration;
      const style = {};
      const oldStyle = {};

      const moveEnd = () => {
        that.$element.trigger('moveEnd');
      };

      if (typeof duration === 'undefined') {
        duration = this.options.speed;
      }
      duration = Math.ceil(duration);

      if ($panel.hasClass(this.classes.active)) {
        distance = this.distance;
        $panel.removeClass(this.classes.active);

        if (this.options.multiple) {
          let number;
          for (var key in this.current) {
            if (this.current[key] === index) {
              number = key;
            } else {
              continue;
            }
            this.current.splice(key, 1);
          }
        } else {
          this.current = null;
        }
      } else {
        if (this.options.direction === 'vertical') {
          distance = $panel.find('.' + this.namespace + '__expander').outerHeight() + this.distance;
        } else {
          distance = $panel.find('.' + this.namespace + '__expander').outerWidth() + this.distance;
        }

        if (this.options.multiple && $.isArray(this.current)) {
          this.current.push(index);
        } else {
          this.current = index;
        }

        if (this.options.multiple) {
          $panel.addClass(this.classes.active);
        } else {
          oldStyle[this.animateProperty] = this.distance;  // used to remove the original distance
          this.animate($oldPanel, oldStyle, duration, this.options.easing, moveEnd);

          $panel.addClass(this.classes.active).siblings().removeClass(this.classes.active);
        }
      }

      style[this.animateProperty] = distance;

      this.animate($panel, style, duration, this.options.easing, moveEnd);
    }
  }

  animate($el, properties, duration, easing, callback) {
    const that = this;

    if(this.transition.supported){
      window.setTimeout(() => {
        that.insertRule(`.transition_${easing} {${that.transition.prefix}transition: all ${duration}ms ${easing} 0s;}`);

        $el.addClass(`transition_${easing}`).one(that.transition.end, function() {
          $el.removeClass(`transition_${easing}`);

          callback.call(this);
        });
        $el.css(properties);
      }, 10);
    } else {
      $el.animate(properties, duration, easing, callback);
    }
  }

  insertRule(rule) {
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
      const style = document.createElement('style');
      style.innerHTML = rule;
      document.head.appendChild(style);
    }
  }

  _trigger(eventType, ...params) {
    let data = [this].concat(params);

    // event
    this.$element.trigger(`${NAMESPACE}::${eventType}`, data);

    // callback
    eventType = eventType.replace(/\b\w+\b/g, (word) => {
      return word.substring(0, 1).toUpperCase() + word.substring(1);
    });
    let onFunction = `on${eventType}`;

    if (typeof this.options[onFunction] === 'function') {
      this.options[onFunction].apply(this, params);
    }
  }

  enable() {
    this.disabled = false;
    this.$element.removeClass(this.classes.disabled);
    this._trigger('enable');
  }

  disable() {
    this.disabled = true;
    this.$element.addClass(this.classes.disabled);
    this._trigger('disable');
  }

  destroy() {
    this.$element.data(NAMESPACE, null);
    this.$element.remove();
    this._trigger('destroy');
  }

  static setDefaults(options) {
    $.extend(DEFAULTS, $.isPlainObject(options) && options);
  }
}

export default asAccordion;
