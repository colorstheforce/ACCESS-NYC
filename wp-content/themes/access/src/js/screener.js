/* eslint-env browser */
// Core-js polyfills.
// Core-js is made available as a dependency of @babel/preset-env
import 'core-js/features/array/includes';

// Core Modules
import Screener from 'modules/screener';

// Patterns Framework
import Tooltips from 'utilities/tooltips/tooltips';

import 'main';

(function() {
  'use strict';

  // Initialize eligibility screener.
  let el = document.querySelector(Screener.Selectors.FORM);
  if (el) new Screener(el).init();

  /**
   * Initialize tooltips
   */
  (elements => {
    elements.forEach(element => new Tooltips(element));
  })(document.querySelectorAll(Tooltips.selector));
})();
