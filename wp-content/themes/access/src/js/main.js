/* eslint-env browser */
// Core-js polyfills.
// Core-js is made available as a dependency of @babel/preset-env
import 'core-js/fn/promise';
import 'core-js/fn/array/for-each';

import jQuery from 'jquery';

// Element.prototype.polyfills
import 'modules/polyfill-element-matches';
import 'modules/polyfill-element-remove';

import ShareForm from 'modules/share-form';
import TextSizer from 'modules/text-sizer';
import Tooltip from 'modules/tooltip';
import Utility from 'modules/utility';
import Accordion from 'components/accordion/accordion.common';
import Filter from 'components/filter/filter.common';
import NearbyStops from 'components/nearby-stops/nearby-stops.common';
import Newsletter from 'objects/newsletter/newsletter.common';


(function(window, $) {
  'use strict';


  Utility.configErrorTracking(window);

  // Get SVG sprite file. See: https://css-tricks.com/ajaxing-svg-sprite/
  $.get('/wp-content/themes/access/assets/svg/icons.18dca930.svg',
    Utility.svgSprites
  );

  let $body = $('body');

  // Attach site-wide event listeners.
  $body.on(
    'click',
    '.js-simple-toggle, [data-js="toggle"]', // use the data attr selector
    Utility.simpleToggle
  ).on('click', '[data-js="toggle-nav"]', event => {
    let element = $(event.currentTarget);
    // Shows/hides the mobile nav and overlay.
    event.preventDefault();
    $('body').toggleClass('overlay active:overlay');
    $(element.attr('href')).toggleClass('active:o-mobile-nav');
  }).on('click', '.js-toggle-search', e => {
    // Shows/hides the search drawer in the main nav.
    e.preventDefault();
    const $search = $('#search');
    $search.toggleClass('active');
    if ($search.hasClass('active')) {
      setTimeout(function() {
        $('#search-field').focus();
      }, 20);
    }
  }).on('click', '.js-hide-search', e => {
    // Hides the search drawer in the main nav.
    e.preventDefault();
    $('#search').removeClass('active');
  });

  // Initialize ACCESS NYC Patterns lib components
  new Accordion();
  new Filter();
  new NearbyStops();

  // Instantiate Newsletter Class
  let newsletter = document.querySelector(Newsletter.selector);
  if (newsletter) new Newsletter(newsletter);

  // Show/hide share form disclaimer
  $body.on('click', '.js-show-disclaimer', ShareForm.ShowDisclaimer);

  // A basic click tracking function
  $body.on('click', '[data-js*="track"]', event => {
    /* eslint-disable no-console, no-debugger */
    let key = event.currentTarget.dataset.trackKey;
    let data = JSON.parse(event.currentTarget.dataset.trackData);
    Utility.track(key, data);
    /* eslint-enable no-console, no-debugger */
  });

  // Capture the queries on Search page
  $(window).on('load', function() {
    let $wtSearch = $('[data-js="wt-search"]');
    if (~window.location.href.indexOf('?s=') && $wtSearch.length) {
      let key = $wtSearch.data('wtSearchKey');
      let data = $wtSearch.data('wtSearchData');
      Utility.webtrends(key, data);
    }
  });

  // On the search results page, submits the search form when a category is
  // chosen.
  $('.js-program-search-filter').on('change', 'input', e => {
    $(e.currentTarget).closest('form')[0].submit();
  });

  // Initialize text sizer module.
  $(`.${TextSizer.CssClass.CONTROLLER}`).each((i, el) => {
    const textSizer = new TextSizer(el);
    textSizer.init();
  });

<<<<<<< HEAD
  // Initialize eligibility screener.
  $(`.${Screener.CssClass.FORM}`).each((i, el) => {
    const screener = new Screener(el);
    screener.init();
  });

  // Initialize maps if present.
  const $maps = $('.js-map');

  /**
   * Callback function for loading the Google maps library.
   */

  window.initializeMaps = () => {
    $maps.each((i, el) => {
      const map = new OfficeMap(el);
      map.init();
    });
  };

  // Initialize simple maps.
  $('.js-static-map').each((i, el) => {
    const staticMap = new StaticMap(el);
    staticMap.init();
  });

  // For location detail pages, this overwrites the link to the "back to map"
  // button if the previous page was the map. We want the user to return to
  // the previous state of the map (via the same URL) rather than simply going
  // back to the default map.
  $('.js-location-back').each((i, el) => {
    if (window.document.referrer.indexOf('/locations/?') >= 0) {
      $(el).attr('href', window.document.referrer);
    }
  });

=======
>>>>>>> 1ebae6c3aa840a11e9cadb8d5006af9fb78f78ef
  // Initialize tooltips.
  $(`.${Tooltip.CssClass.TRIGGER}`).each((i, el) => {
    const tooltip = new Tooltip(el);
    tooltip.init();
  });

  // Initialize share by email/sms forms.
  $(`.${ShareForm.CssClass.FORM}`).each((i, el) => {
    const shareForm = new ShareForm(el);
    shareForm.init();
  });

  // For pages with "print-view" class, print the page on load. Currently only
  // used on program detail pages after the print link is clicked.
  if ($('html').hasClass('print-view')) {
    window.onload = window.print;
  }

  // Add noopener attribute to new window links if it isn't there.
  $('a[target="_blank"]').each(Utility.noopener);

  // Enable environment warnings
  $(window).on('load', () => Utility.warnings());
})(window, jQuery);
