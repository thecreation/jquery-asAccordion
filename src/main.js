import $ from 'jquery';
import asAccordion from './asAccordion';
import info from './info';

const NAMESPACE = 'asAccordion';
const OtherAsAccordion = $.fn.asAccordion;

const jQueryAsAccordion = function(options, ...args) {
  if (typeof options === 'string') {
    const method = options;

    if (/^_/.test(method)) {
      return false;
    } else if ((/^(get)/.test(method))) {
      const instance = this.first().data(NAMESPACE);
      if (instance && typeof instance[method] === 'function') {
        return instance[method](...args);
      }
    } else {
      return this.each(function() {
        const instance = $.data(this, NAMESPACE);
        if (instance && typeof instance[method] === 'function') {
          instance[method](...args);
        }
      });
    }
  }

  return this.each(function() {
    if (!$(this).data(NAMESPACE)) {
      $(this).data(NAMESPACE, new asAccordion(this, options));
    }
  });
};

$.fn.asAccordion = jQueryAsAccordion;

$.asAccordion = $.extend({
  setDefaults: asAccordion.setDefaults,
  noConflict: function() {
    $.fn.asAccordion = OtherAsAccordion;
    return jQueryAsAccordion;
  }
}, info);
