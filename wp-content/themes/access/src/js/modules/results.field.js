/* eslint-env browser */
'use strict';

import $ from 'jquery';
import ShareForm from 'modules/share-form';
import Utility from 'modules/utility';

/**
 * Requires Documentation
 * @class
 */
class ResultsField {
  /**
   * @param {HTMLElement} el - The form element for the component.
   * @constructor
   */
  constructor(el) {
    /** @private {HTMLElement} The component element. */
    this._el = el;

    /** @private {boolean} Whether this component has been initialized. */
    this._initialized = false;
  }

  /**
   * If this component has not yet been initialized, attaches event listeners.
   * @method
   * @return {this} OfficeMap
   */
  init() {

    if (this._initialized) {
      return this;
    }

    /**
     * DOM Event Listeners
     */

    let $el = $(this._el);

    // Initialize share by email/sms forms.
    $(`.${ShareForm.CssClass.FORM}`).each((i, el) => new ShareForm(el).init());

    // Open links in new window
    $el.on('click', ResultsField.Selectors.HYPERLINK, this._targetBlank);

    // Remove programs
    $el.on('click', ResultsField.Selectors.REMOVE_PROGRAM, this._removeProgram);

    this._initialized = true;
    return this;

  }

  /**
   * Open links in new window by adding target blank to them.
   * @param  {event} event the onclick event
   * @return {null}
   */
  _targetBlank(event) {
    $(event.currentTarget).attr('target', '_blank');
  }

  /**
   * Remove program from results, and trim the sharable url
   * @param  {event} event the onclick event
   * @return {null}
   */
  _removeProgram(event) {
    let categories = Utility.getUrlParameter('categories').split(',');
    let programs = Utility.getUrlParameter('programs').split(',');
    let guid = Utility.getUrlParameter('guid');
    let date = Utility.getUrlParameter('date');
    let removeCode = event.currentTarget.dataset.removeCode;
    let index = programs.indexOf(removeCode);
    let location = window.location;
    let shareUrl = [location.origin, location.pathname, '?'].join('');

    event.preventDefault();

    if (index > -1) programs.splice(index, 1);

    $(`[data-code="${removeCode}"]`).hide();

    shareUrl += [
      ['categories=', categories.join('%2C')].join(''),
      ['programs=', programs.join('%2C')].join(''),
      ['guid=', guid].join(''),
      ['date=', date].join('')
    ].join('&');

    $(ResultsField.Selectors.SHARE_URLS).each((index, element) => {
      element.value = shareUrl;
    });

    return shareUrl;
  }

}

/**
 * Selectors for the results page
 * @type {Object}
 */
ResultsField.Selectors = {
  'DOM': '[data-js="results"]',
  'HYPERLINKS': 'a[href*]',
  'REMOVE_PROGRAM': '[data-js="remove-program"]',
  'SHARE_URLS': 'input[name="url"]'
}

export default ResultsField;
