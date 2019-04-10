/* eslint-env browser */
import jQuery from 'jquery';
import _ from 'underscore';

// eslint-disable-next-line no-unused-vars
import 'modules/polyfill-window-scroll';
import 'modules/polyfill-element-matches';
import 'core-js/features/promise';

import Field from 'modules/field';
import ResultsField from 'modules/results-field';
import ShareForm from 'modules/share-form';
import Tooltip from 'modules/tooltip';
import Utility from 'modules/utility';
import Accordion from 'components/accordion/accordion.common';

(function(window, $) {
  'use strict';

  Utility.configErrorTracking(window);

  // Get SVG sprite file.
  $.get('/wp-content/themes/access/assets/svg/icons.svg', Utility.svgSprites);

  let $body = $('body');

  // Simple Toggle
  $body.on('click', '[data-js*="simple-toggle"]', Utility.simpleToggle);

  // Show/hide share form disclaimer
  $body.on('click', '.js-show-disclaimer', ShareForm.ShowDisclaimer);

  // A basic click tracking function
  $body.on('click', '[data-js*="track"]', event => {
    let key = event.currentTarget.dataset.trackKey;
    let data = JSON.parse(event.currentTarget.dataset.trackData);
    Field.track(key, data);
  });

  // Initialize eligibility screener.
  $(Field.Selectors.DOM).each((i, el) =>
    new Field(el).init());

  // Initialize eligibility screener.
  $(ResultsField.Selectors.DOM).each((i, el) =>
    new ResultsField(el).init());

  // Initialize tooltips.
  $(`.${Tooltip.CssClass.TRIGGER}`).each((i, el) =>
    new Tooltip(el).init());

  // Initialize accordion components
  new Accordion();

  // Application reloading
  $('[data-js="reload"]').each((i, el) => {
    $(el).on('click', event => {
      event.preventDefault();
      let message = _.findWhere(window.LOCALIZED_STRINGS,
          {slug: 'MSG_RELOAD'}
        ).label;
      let dialogue = confirm(message);
      if (dialogue) {
        if (event.currentTarget.href) {
          window.location = event.currentTarget.href;
        } else {
          location.reload();
        }
      }
      return false;
    });
  });

  // Add noopener attribute to new window links if it isn't there.
  $('a[target="_blank"]').each(Utility.noopener);

  // Enable environment warnings
  $(window).on('load', () => Utility.warnings());
})(window, jQuery);