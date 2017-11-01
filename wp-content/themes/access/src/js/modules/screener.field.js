/* eslint-env browser */
'use strict';

import $ from 'jquery';
// import Cookies from 'js-cookie';
import ScreenerHousehold from 'modules/screener-household';
import ScreenerPerson from 'modules/screener-person';
import ScreenerClient from 'modules/screener-client';
import ScreenerStaff from 'modules/screener-staff';
import Shared from 'modules/screener';
import Utility from 'modules/utility';
import _ from 'underscore';
import Vue from 'vue/dist/vue.common';
import Validator from 'vee-validate';
import CalcInput from 'modules/calc-input';

/**
 * Requires Documentation
 * @class
 */
class ScreenerField {
  /**
   * @param {HTMLElement} el - The form element for the component.
   * @constructor
   */
  constructor(el) {
    /** @private {HTMLElement} The component element. */
    this._el = el;

    /** @private {boolean} Whether this component has been initialized. */
    this._initialized = false;

    /** @private {boolean} Whether the google reCAPTCHA widget is required. */
    this._recaptchaRequired = false;

    /** @private {boolean} Whether the google reCAPTCHA widget has passed. */
    this._recaptchaVerified = false;

    /** @private {object} The screener routes and event hooks */
    this._routes = {
      admin: function(vue) {},
      screener: function(vue) {},
      recap: function(vue) {
        ScreenerField.renderRecap(vue);
      }
    };

    /** @private {object} The Vue configuration */
    this._vue = {
      delimiters: ['v{', '}'],
      el: '#vue',
      data: {
        /* Default ACCESS NYC Modules */
        people: [new ScreenerPerson({
          headOfHousehold: true
        })],
        household: new ScreenerHousehold({
          city: 'NYC',
          livingPreferNotToSay: true
        }),
        categories: [],
        /* Additional Modules */
        client: new ScreenerClient(),
        staff: new ScreenerStaff(),
        /* UI Data */
        /** @type {array} */
        categoriesCurrent: [],
        /** @type {array} */
        programsFilter: [],
        /** @type {boolean} */
        disclaimer: false,
        /** @type {array} */
        expenses: [],
        /** @type {Number} */
        income: 0
      },
      methods: {
        resetAttr: ScreenerField.resetAttr,
        setAttr: ScreenerField.setAttr,
        setAllAttr: ScreenerField.setAllAttr,
        setHousing: ScreenerField.setHousing,
        populate: ScreenerField.populate,
        pushPayment: ScreenerField.pushPayment,
        getPayment: ScreenerField.getPayment,
        removePayment: ScreenerField.removePayment,
        removeAllPayments: ScreenerField.removeAllPayments,
        push: ScreenerField.push,
        checked: ScreenerField.checked,
        singleOccupant: ScreenerField.singleOccupant,
        validate: ScreenerField.validate,
        localString: ScreenerField.localString,
        formatDollars: ScreenerField.formatDollars,
        getTypedVal: ScreenerField.getTypedVal
      }
    };
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
     * Reactive Elements
     */

    Validator.Validator.extend('zip', ScreenerField.validateZipField);

    Vue.use(Validator, {events: 'blur', zip: 'zip'});

    Vue.component('personlabel', ScreenerField.personLabel);

    this._vue = new Vue(this._vue); // Initializes the Vue component

    /**
     * DOM Event Listeners
     */

    let $el = $(this._el);

    // Submit
    $el.on('click', '[data-js="submit"]', () => this._submit(event));

    // Basic toggles
    $el.on('change', `.${ScreenerField.Selectors.TOGGLE}`, this._toggler);

    // Validate calculated inputs based on regular expressions.
    new CalcInput(this._el);

    // Mask phone numbers
    $el.on('focus', 'input[type="tel"]',
      (event) => Utility.maskPhone(event.currentTarget));

    // Routing
    window.addEventListener('hashchange', (event) => this._router(event));

    // Close Questions
    $el.on('click', '[data-js="question"]', (event) => {
      this._routerQuestion(event.currentTarget.hash);
    });

    // Set the initial view
    this._routerPage('#page-admin');

    return this;
  }

  /**
   * The page to go to.
   * @param  {string} page the page hash
   */
  _routerPage(page) {
    let view = document.querySelector(ScreenerField.Selectors.VIEW);

    /* eslint-disable no-console, no-debugger */
    if (Utility.debug()) console.log(`routerPage: ${page}`);
    /* eslint-enable no-console, no-debugger */

    window.location.hash = page;
    view.scrollTop = 0;

    $(`.${ScreenerField.Selectors.PAGE}`)
      .removeClass(ScreenerField.Selectors.ACTIVE)
      .attr('aria-hidden', 'true')
      .find(':input, a')
      .attr('tabindex', '-1');

    $(page).addClass(ScreenerField.Selectors.ACTIVE)
      .removeAttr('aria-hidden')
      .find(':input, a')
      .removeAttr('tabindex');
  }

  /**
   * Jumps to screener question
   * @param  {string} hash The question's hash id
   */
  _routerQuestion(hash) {
    let page = $(hash).closest(`.${ScreenerField.Selectors.PAGE}`);
    let target = $(hash).find(`.${ScreenerField.Selectors.TOGGLE_QUESTION}`);
    let show = !target.hasClass('active');

    if (!page.hasClass('active')) {
      this._routerPage(`#${page.attr('id')}`);
      show = true;
    }

    // Show
    if (show) {
      /* eslint-disable no-console, no-debugger */
      if (Utility.debug()) console.log(`routerQuestion: Show ${hash}`);
      /* eslint-enable no-console, no-debugger */
      $(`.${ScreenerField.Selectors.TOGGLE_QUESTION}`)
        .addClass('hidden')
        .removeClass('active')
        .prop('aria-hidden', true);

      target.addClass('active')
        .removeClass('hidden')
        .prop('aria-hidden', false);

      // Scrolling Behavior
      event.preventDefault();
      setTimeout(() => {
        document.querySelector(hash)
          .scrollIntoView(true);
        document.querySelector(ScreenerField.Selectors.VIEW)
          .scrollBy({top: -60, left: 0, behavior: 'auto'});
      }, 1);

      return;
    }

    // Hide
    /* eslint-disable no-console, no-debugger */
    if (Utility.debug()) console.log(`routerQuestion: Hide ${hash}`);
    /* eslint-enable no-console, no-debugger */
    target.addClass('hidden')
      .removeClass('active')
      .prop('aria-hidden', true);
    // Scrolling Behavior
    event.preventDefault();
  }

  /**
   * The router, listens for hash changes and initializes appropriate hooks
   * @param  {object} event the window hash change event
   * @return {null}
   */
  _router(event) {
    let hash = window.location.hash;
    let type = hash.split('-')[0];
    let route = hash.split('-')[1];

    if (type === '#page') {
      this._routes[route](this._vue);
      this._routerPage(hash);
    }

    if (type === '#question') {
      this._routerQuestion(hash);
    }

    return this;
  }

  /**
   * For a given input, if it has the "toggles" data attribute, show or hide
   * another element selected by the toggles values based on the value of the
   * input. If the input has a "shows" or "hides" data attribute, show or hide
   * relevant element accordingly.
   * @private
   * @param {object} event - toggle event.
   */
  _toggler(event) {
    const $el = $(event.currentTarget);
    if ($el.data('toggles')) {
      const $target = $($el.data('toggles'));
      if (
          ($el.prop('checked') && Boolean(parseInt($el.val(), 10))) ||
          ($el.is('select') && $el.val())
      ) {
        $target.removeClass(ScreenerField.Selectors.HIDDEN);
      } else {
        $target.addClass(ScreenerField.Selectors.HIDDEN);
      }
    }
    if ($el.data('shows')) {
      $($el.data('shows')).removeClass(ScreenerField.Selectors.HIDDEN);
    }
    if ($el.data('hides')) {
      $($el.data('hides')).addClass(ScreenerField.Selectors.HIDDEN);
    }
  }

  /**
   * Returns the JSON object for Drools submission.
   * @private
   * @param  {object} vue the data store
   * @return {object}     drools JSON
   */
  _getDroolsJSON(vue) {
    const json = {
      lookup: 'KieStatelessSession',
      commands: []
    };

    // Insert Household data.
    json.commands.push({
      insert: {
        object: {
          'accessnyc.request.Household': vue.household.toObject()
        }
      }
    });

    // Insert Person data.
    _.each(vue.people.slice(0, vue.household.get('members')), (person) => {
      if (person) {
        json.commands.push({
          insert: {
            object: {
              'accessnyc.request.Person': person.toObject()
            }
          }
        });
      }
    });

    // Additional Drools commands.
    json.commands.push({
      'fire-all-rules': {
        'out-identifier': 'rulesFiredCountOut'
      }
    });

    json.commands.push({
      query: {
        'name': 'findEligibility',
        'arguments': [],
        'out-identifier': 'eligibility'
      }
    });

    // This Drools command outputs a large number of debugging variables that
    // are not necessary for production.
    if (Utility.debug()) {
      json.commands.push({
        'get-objects': {
          'out-identifier': 'getObjects'
        }
      });
    }

    return json;
  }

  /**
   * Submits the JSON payload to Drools.
   * @private
   * @param  {object} event - the form submit event
   * @return {jqXHR}
   */
  _submit(event) {
    let url = event.target.dataset.action;
    let json = this._getDroolsJSON(this._vue);

    /* eslint-disable no-console, no-debugger */
    if (Utility.debug()) {
      console.warn(json);
      console.log(JSON.stringify(json));
      debugger;
    }

    return $.ajax({
      url: url,
      type: 'post',
      data: {
        action: 'drools',
        data: json
      }
    }).done((data) => {
      let result = {
        'data': data,
        'url': url,
        'json': json
      };

      if (data.type !== 'SUCCESS') {
        if (Utility.debug()) {
          console.warn(result);
          debugger;
        }
        alert('There was an error getting results. Please try again later.');
        return;
      }

      if (Utility.debug()) {
        console.warn(result);
        debugger;
      }

      const programs = _.chain(
          Utility.findValues(data, 'code')
        ).filter(
          (item) => _.isString(item)
        // filter out the programs they are already receiving
        ).filter(
          (item) => (this._vue.programsFilter.indexOf(item) === -1)
        ).uniq().value();

      if (Utility.debug()) {
        console.warn(programs);
        debugger;
      }

      const params = {};

      if (this._vue.categories.length) {
        params.categories = this._vue.categories.join(',');
      }

      if (programs.length) {
        params.programs = programs.join(',');
      }

      if ('GUID' in data) {
        params.guid = data.GUID;
      }

      params.date = Math.floor(Date.now() / 1000);

      // For security, reset the form before redirecting so that results are
      // not visible when someone hits back on their browser.
      this._el.reset();

      window.location = `./results?${$.param(params)}`;
    });
    /* eslint-enable no-console, no-debugger */
  }
}

/**
 * Format number value and make sure it has '.00'
 * @param  {string} event - the blur event
 */
ScreenerField.formatDollars = function(event) {
  let value = event.currentTarget.value;
  let postfix = '';
  if (`${value}`.indexOf('.') > -1) {
    let split = `${value}`.split('.');
    postfix = (split[1].length == 1) ? '0' : postfix;
    postfix = (split[1].length == 0) ? '00' : postfix;
    value += postfix;
  } else if (value != '') {
    value += '.00';
  }
  event.currentTarget.value = value;
};

/**
 * Checks to see if the input's value is a valid NYC zip code.
 */
ScreenerField.validateZipField = {
  getMessage: () => 'Must be a valid NYC zip code',
  validate: function(value) {
    if (ScreenerField.NYC_ZIPS.indexOf(value) > -1) return true;
    return false;
  }
};

/**
 * Validation functionality, if a scope is attatched, it will only validate
 * against the scope stored in validScopes
 * @param  {event} event the click event
 */
ScreenerField.validate = function(event) {
  event.preventDefault();
  let scope = event.currentTarget.dataset.scope;
  if (typeof scope !== 'undefined') {
    this.$validator.validateAll(scope)
      .then(ScreenerField.valid);
  } else {
    this.$validator.validate()
      .then(ScreenerField.valid);
  }
};

/**
 * Validate
 * @param  {boolean} valid wether the validator passes validation
 */
ScreenerField.valid = function(valid) {
  if (!valid) {
    /* eslint-disable no-console, no-debugger */
    if (Utility.debug())
      console.warn('Some required fields are not filled out.');
    /* eslint-enable no-console, no-debugger */
  } else {
    window.location.hash = event.currentTarget.hash;
  }
  // debug bypasses validation
  if (Utility.debug())
    window.location.hash = event.currentTarget.hash;
};

/**
 * Push/Pull items in an array
 * @param {object} event listener object, requires data;
 *                       {object} array to push to
 *                       {key} if object is contained in a model,
 *                       add the data-key parameter
 */
ScreenerField.push = function(event) {
  let el = event.currentTarget;
  let obj = el.dataset.object;
  let key = el.dataset.key;
  let value = el.value;
  // if there is a key, it's probably one of the custom modules
  // with storage in ._attrs, so we'll get the value for processing
  let current = (typeof key === 'undefined')
    ? this[obj] : this[obj].get(key);

  // get the current index
  let index = current.indexOf(value);

  // if checked, push, if not remove item
  if (el.checked) {
    current.push(value);
  } else if (index > -1) {
    current.splice(index, 1);
  }

  // remove duplicates
  current = _.uniq(current);

  // if there is a key, it's probably one of the custom modules
  // with storage in ._attrs
  if (typeof key != 'undefined') {
    this[obj].set(key, current);
  } else {
    this[obj] = current;
  }
};

/**
 * Checks model to see if it is included in a list or not.
 * @param  {string} list  the name of the model
 * @param  {string} value the name of the value to check
 * @return {boolean}      wether or not the value is in the list or not
 */
ScreenerField.checked = function(list, value) {
  return (this[list].indexOf(value) > -1);
};

/**
 * Resets a attribute matrix, ex "none of these apply"
 * @param  {object} event the click event
 */
ScreenerField.resetAttr = function(event) {
  let el = event.currentTarget;
  let obj = el.dataset.object;
  let index = el.dataset.index;
  let keys = el.dataset.key.split(',');
  let value = (el.value === 'true');
  for (let i = keys.length - 1; i >= 0; i--) {
    /* eslint-disable no-console, no-debugger */
    if (typeof index === 'undefined') {
      this[obj].set(keys[i], value);
      if (Utility.debug())
        console.log(`resetAttr: ${obj}, ${keys[i]}, ${value}`);
    } else {
      this[obj][index].set(keys[i], value);
      if (Utility.debug())
        console.log(`resetAttr: ${obj}, ${index}, ${keys[i]}, ${value}`);
    }
    /* eslint-enable no-console, no-debugger */
    let el = document.querySelector(`[data-key="${keys[i]}"]`);
    if (el) el.checked = false;
  }
};

/**
 * Inforces strict types for certain data
 * @param  {event} event - event listener object, requires data;
 *                       - object {object} 'people' or 'household'
 *                       - index {number} item index in object (optional)
 *                       - key {string} attribute to set
 *                       - type {string} type of attribute
 */
ScreenerField.setAttr = function(event) {
  let el = event.currentTarget;
  let obj = el.dataset.object;
  let index = el.dataset.index;
  let key = el.dataset.key;
  let reset = el.dataset.reset;
  // get the typed value;
  let value = ScreenerField.getTypedVal(el);
  // set the attribute;
  /* eslint-disable no-console, no-debugger */
  if (typeof index === 'undefined') {
    this[obj].set(key, value);
    if (Utility.debug())
      console.dir(`setAttr: ${obj}, ${key}, ${value}`);
  } else {
    this[obj][index].set(key, value);
    if (Utility.debug())
      console.dir(`setAttr: ${obj}, ${index}, ${key}, ${value}`);
  }
  /* eslint-enable no-console, no-debugger */
  // reset an element based on this value;
  if (typeof reset != 'undefined')
    document.querySelector(reset).checked = false;
};

/**
 * Set attribute for all objects in collection.
 * @param  {event} event - event listener object, requires data;
 *                       - object {object} 'people' or 'household'
 *                       - key {string} attribute to set
 *                       - type {string} type of attribute
 */
ScreenerField.setAllAttr = function(event) {
  let el = event.currentTarget;
  let obj = el.dataset.object;
  let key = el.dataset.key;
  let keys = el.dataset.key.split(',');
  let value = ScreenerField.getTypedVal(el);
  for (let i = this[obj].length - 1; i >= 0; i--) {
    for (let k = keys.length - 1; k >= 0; k--) {
      this[obj][i].set(keys[k], value);
    }
  }
  /* eslint-disable no-console, no-debugger */
  if (Utility.debug())
    console.dir(`setAllAttr: ${obj}, ${key}, ${value}`);
  /* eslint-enable no-console, no-debugger */
};

/**
 * Special processor for the household model housing attributes.
 * @param {event} event - the change event for housing
 */
ScreenerField.setHousing = function(event) {
  let el = event.target;
  let key = el.dataset.key;
  let keys = [];
  let value = ScreenerField.getTypedVal(el);
  let reset = false;

  this.household.set(key, value);

  if (key === 'livingPreferNotToSay' && value === true) {
    keys = el.dataset.keys.split(',');
    for (let k = keys.length - 1; k >= 0; k--) {
      this.household.set(keys[k], false);
    }
    reset = true;
  } else {
    this.household.set('livingPreferNotToSay', false);
  }

  // rental reset
  if ((key === 'livingRenting' && value === false) || reset) {
    this.household.set('livingRentalType', '');
    for (let r = this.people.length - 1; r >= 0; r--) {
      this.people[r].set('livingRentalOnLease', false);
    }
  }

  // owner reset
  if ((key === 'livingOwner' && value === false) || reset) {
    for (let o = this.people.length - 1; o >= 0; o--) {
      this.people[o].set('livingOwnerOnDeed', false);
    }
  }
};

/**
 * Populate the family, start at one because
 * the first person exists by default
 * @param  {event} event to pass to setAttr()
 */
ScreenerField.populate = function(event) {
  let value = event.currentTarget.value;
  if (value === '' || parseInt(value, 10) === 0) return;
  let dif = value - this.people.length;
  // set the data for the model
  this.setAttr(event);
  if (dif > 0) { // add members if positive
    for (let i = 0; i <= dif - 1; i++) {
      let person = new ScreenerPerson();
      // person._attrs.guid = Utility.guid();
      this.people.push(person);
    }
  } else if (dif < 0) { // remove members if negative
    this.people = this.people.slice(0, this.people.length + dif);
  }
};

/**
 * Collects DOM income data and updates the model, if there is no income
 * data based on the DOM, it will create a new income object
 * @param  {object} event - change event, requires data attributes;
 *                          person {index}
 *                          val {model attribute key}
 *                          key {income key}
 *                          value {model attribute value}
 */
ScreenerField.pushPayment = function(event) {
  let el = event.currentTarget;
  let obj = el.dataset.object;
  let objIndex = parseInt(el.dataset.index);
  let type = el.value;
  let key = el.dataset.key;
  let current = _.findIndex(
    this[obj][objIndex]._attrs[key], {'type': type}
  );

  // if the payment exists
  /* eslint-disable no-console, no-debugger */
  if (type === '' || el.checked === false) {
    // remove payment
    if (Utility.debug())
      console.log(`pushPayment: Remove; ${key}, ${type}`);
    this[obj][objIndex]._attrs[key].splice(current, 1);
  } else {
    // add payment
    if (Utility.debug())
      console.log(`pushPayment: Add; ${key}, ${type}`);
    this[obj][objIndex].addPayment(key, type);
  }
  /* eslint-enable no-console, no-debugger */
};

/**
 * Remove a payment if the element target value is blank
 * @param  {event} event - change event object
 */
ScreenerField.removePayment = function(event) {
  if (event.currentTarget.value !== '') return;
  let el = event.currentTarget;
  let obj = el.dataset.object;
  let objIndex = parseInt(el.dataset.index);
  let key = el.dataset.key;
  let keyIndex = el.dataset.keyIndex;
  /* eslint-disable no-console, no-debugger */
  if (Utility.debug())
    console.log(`removePayment: ${key}`);
  /* eslint-enable no-console, no-debugger */
  this[obj][objIndex]._attrs[key].splice(keyIndex, 1);
};

/**
 * Removes all payments for all persons in household
 * @param  {object} event the radio button toggle event
 */
ScreenerField.removeAllPayments = function(event) {
  if (event.currentTarget.value === 1) return;
  let key = event.currentTarget.dataset.key;
  for (let i = this.people.length - 1; i >= 0; i--) {
    this.people[i]._attrs[key] = [];
  }
};

/**
 * Find a payment by type in a collection
 * @param  {string} obj       - the vue opject to search
 * @param  {integer} objIndex - the index of the model within the vue object
 * @param  {string} key       - the key of the model's attr
 * @param  {[type]} type      - the type value to search by
 * @return {object}           - the payment, false if not found
 */
ScreenerField.getPayment = function(obj, objIndex, key, type) {
  let payment = _.findWhere(
    this[obj][objIndex]._attrs[key], {'type': type}
  );
  return (payment) ? payment : false;
};

/**
 * Check for single occupant of household
 * @return {boolean} if household is 1 occupant
 */
ScreenerField.singleOccupant = function() {
  return (this.household._attrs.members === 1);
};

/**
 * Returns the value of a supplied input in the type defined by a data-type
 * attribute on that input.
 * @param {HTMLElement} input
 * @return {boolean|Number|string} typed value
 */
ScreenerField.getTypedVal = function(input) {
  const val = input.value;
  let finalVal = input.value;
  switch (input.dataset.type) {
    case ScreenerField.InputType.BOOLEAN: {
      if (input.type === 'checkbox') {
        finalVal = input.checked;
      } else { // assume it's a radio button
        // if the radio button is using true/false;
        // if the radio button is using 1 or 0;
        finalVal = (val === 'true') ? true : Boolean(parseInt(val, 10));
      }
      /* eslint-disable no-console, no-debugger */
      if (Utility.debug())
        console.log(
          `getTypedVal: BOOLEAN, ${finalVal}:${typeof val}>${typeof finalVal}`);
      /* eslint-enable no-console, no-debugger */
      break;
    }
    case ScreenerField.InputType.FLOAT: {
      finalVal = (
          _.isNumber(parseFloat(val)) &&
          !_.isNaN(parseFloat(val))
        ) ? parseFloat(val) : 0;
      /* eslint-disable no-console, no-debugger */
      if (Utility.debug())
        console.log(
          `getTypedVal: FLOAT, ${finalVal}:${typeof val}>${typeof finalVal}`);
      /* eslint-enable no-console, no-debugger */
      break;
    }
    case ScreenerField.InputType.INTEGER: {
      finalVal = (
          _.isNumber(parseInt(val, 10)) &&
          !_.isNaN(parseInt(val, 10))
        ) ? parseInt(input.value, 10) : 0;
      /* eslint-disable no-console, no-debugger */
      if (Utility.debug())
        console.log(
          `getTypedVal: INTEGER, ${finalVal}:${typeof val}>${typeof finalVal}`);
      /* eslint-enable no-console, no-debugger */
      break;
    }
  }
  return finalVal;
};

/**
 * Return the local string label for values
 * @param  {string} slug the slug value of the string
 * @return {string}      the local string label
 */
ScreenerField.localString = function(slug) {
  try {
    return _.findWhere(
      window.LOCALIZED_STRINGS,
      {slug: slug}
    ).label;
  } catch (error) {
    return slug;
  }
};

/**
 * Assembles data for the recap view and renders the recap template.
 * @param  {object} vue - Screener data
 */
ScreenerField.renderRecap = function(vue) {
  const templateData = {
    categories: [],
    household: {
      assets: `$${vue.household.get('cashOnHand')}`,
      owners: [],
      rentalType: '',
      renters: [],
      types: [],
      zip: vue.household.get('zip')
    },
    members: []
  };

  // Add programs.
  _.each(vue.categories, (category) => {
    const obj = {
      slug: category,
      label: Utility.localize(category)
    };
    templateData.categories.push(obj);
  });

  const housingTypes = [
    'Renting',
    'Owner',
    'StayingWithFriend',
    'Hotel',
    'Shelter',
    'PreferNotToSay'
  ];

  // Add housing type.
  _.each(housingTypes, (type) => {
    if (vue.household.get(`living${type}`)) {
      const obj = {
        slug: type,
        label: Utility.localize(`living${type}`)
      };

      templateData.household.types.push(obj);
    }

    if (type === 'Renting') {
      templateData.household.rentalType =
          Utility.localize(vue.household.get('livingRentalType'));
    }
  });

  // Add household member data.
  _.each(vue.people.slice(0, vue.household.get('members')),
      (person, i) => {
    const member = {
      age: person.get('age'),
      benefits: [],
      conditions: [],
      expenses: [],
      incomes: [],
      isHoh: person.get('headOfHousehold'),
      relation: Utility.localize(person.get('headOfHouseholdRelation'))
    };

    if (person.get('headOfHousehold')) {
      if (i === 0) {
        member.relation = Utility.localize('Self');
      } else {
        member.relation = Utility.localize('HeadOfHousehold');
      }
    }

    _.each(person.getBenefits(), (value, key) => {
      if (value) {
        member.benefits.push(Utility.localize(key));
      }
    });

    _.each(person.getConditions(), (value, key) => {
      if (value) {
        member.conditions.push(Utility.localize(key));
      }
    });

    _.each(['incomes', 'expenses'], (type) => {
      _.each(person.get(type), (item) => {
        const obj = {
          amount: `$${item.amount}`,
          type: Utility.localize(item.type),
          frequency: Utility.localize(item.frequency)
        };
        member[type].push(obj);
      });
    });

    _.each(['livingOwnerOnDeed', 'livingRentalOnLease'], (type) => {
      if (person.get(type)) {
        const obj = {};
        if (person.get('headOfHousehold')) {
          obj.slug = i === 0 ? 'Self' : 'HeadOfHousehold';
        } else {
          obj.slug = person.get('headOfHouseholdRelation');
        }
        obj.label = Utility.localize(obj.slug);
        if (type === 'livingOwnerOnDeed') {
          templateData.household.owners.push(obj);
        } else {
          templateData.household.renters.push(obj);
        }
      }
    });

    templateData.members.push(member);
  });

  const template = $('#screener-recap-template').html();
  const renderedTemplate = _.template(template)(templateData);
  $('#recap-body').html(renderedTemplate);
};

/**
 * Component for the person label
 * @type {Object} Vue Component
 */
ScreenerField.personLabel = {
  props: ['index', 'person'],
  template: '<span class="c-black">' +
    '<span :class="personIndex(index)"></span> ' +
    '<span v-if="index == 0">You, </span>' +
    '<span v-if="person.headOfHousehold">Head of Household, </span>' +
    '<span v-if="index != 0 && person.headOfHouseholdRelation != \'\'">' +
      '{{ personHeadOfHouseholdRelation(person.headOfHouseholdRelation) }}, ' +
    '</span>' +
    '<span v-if="person.age != 0">{{ person.age }}</span>' +
  '</span>',
  methods: {
    personIndex: function(index) {
      let name = 'i-' + index;
      let classes = {
        'screener-members__member-icon': true
      };
      classes[name] = true;
      return classes;
    },
    personHeadOfHouseholdRelation: ScreenerField.localString
  }
};

/**
 * Selectors used by this component.
 * @enum {string}
 */
ScreenerField.Selectors = {
  ACTIVE: 'active',
  DOM: '[data-js="screener-field"]',
  HIDDEN: 'hidden',
  PAGE: 'js-screener-page',
  TOGGLE: 'js-screener-toggle',
  TOGGLE_QUESTION: 'js-toggle-question',
  VIEW: '[data-js="view"]'
};

/**
 * data-type attributes used by this component.
 * @enum {string}
 */
ScreenerField.InputType = {
  BOOLEAN: 'boolean',
  FLOAT: 'float',
  INTEGER: 'integer'
};

/**
 * Valid zip codes in New York City. Source:
 * https://data.cityofnewyork.us/City-Government/Zip-code-breakdowns/6bic-qvek
 * @type {array<String>}
 */
ScreenerField.NYC_ZIPS = Shared.NYC_ZIPS;

export default ScreenerField;
