/* eslint-env browser */
'use strict';

import $ from 'jquery';
import OfficeFilter from 'modules/office-filter';
import OfficeLocation from 'modules/office-location';
import Utility from 'modules/utility';
import InputAutocomplete from
  'access-nyc-patterns/dist/elements/inputs/input-autocomplete.common';
import _ from 'underscore';

/**
 * This is the main controller for the map at the /locations page. This handles
 * rendering the Google map, fetching location details, placing markers, and
 * any map interactions - like filtering and featuring.
 * @class
 */
class OfficeMap {
  /**
   * @param {HTMLElement} el - The html element for the component.
   * @constructor
   */
  constructor(el) {
    /** @private {HTMLElement} The component element. */
    this._el = el;

    /**  {?this._google} The google map object. */
    this._google = window.google;

    /** @private {HTMLElement} The map element. */
    this._mapEl = $(el).find(`.${OfficeMap.CssClass.MAP_BOX}`)[0];

    /** @private {HTMLElement} The map element. */
    this._listEl = $(el).find(`.${OfficeMap.CssClass.RESULT_LIST}`)[0];

    /** @private {HTMLElement} The search box element. */
    this._searchEl = $(el).find(`.${OfficeMap.CssClass.SEARCH_BOX}`)[0];

    /** @private {HTMLElement} The filter control element. */
    this._filterEl = $(el).find(`.${OfficeMap.CssClass.FILTER}`)[0];

    /** @private {HTMLElement} The filter control element. */
    this._paginationEl = $(el).find(`.${OfficeMap.CssClass.PAGINATION}`)[0];

    /** @private {boolean} Whether the map has been initialized. */
    this._initialized = false;

    /** @private {this._google.maps.LatLng} Map position. */
    this._mapPosition = Utility.getUrlParameter('lat') &&
        Utility.getUrlParameter('lng') ?
        new this._google.maps.LatLng(parseFloat(Utility.getUrlParameter('lat')),
            parseFloat(Utility.getUrlParameter('lng'))) :
        new this._google.maps.LatLng(Utility.CONFIG.DEFAULT_LAT,
            Utility.CONFIG.DEFAULT_LNG);

    /** @private {?this._google.maps.Map} The google map object. */
    this._map = new this._google.maps.Map(this._mapEl, {
      zoom: 11,
      center: this._mapPosition
    });

    /** @private {this._google.maps.places.Autocomplete}Autocomplete instance */
    this._service = new this._google.maps.places.AutocompleteService();

    /** @private {this._google.maps.places.PlaceService}PlaceService instance */
    this._placeService = new this._google.maps.places.PlacesService(this._map);

    /** @private {this._inputAutocomplete} Access Design Pattern */
    this._inputAutocomplete = new InputAutocomplete({options: []});

    /** @private {OfficeFilter} Program filter controller. */
    this._filter = new OfficeFilter(this._filterEl);

    /** @private {Array<OfficeLocation>} The office locations. */
    this._locations = [];

    /** @private {Array<OfficeLocation>} The office locations. */
    this._filteredLocations = [];

    /** @private {Array<Number>} The IDs of programs to filter by. */
    this._programs = Utility.getUrlParameter('programs') ?
        _.map(decodeURIComponent(Utility.getUrlParameter('programs'))
        .split(','), num => {
            return parseInt(num, 10);
        }) : [];
  }

  /**
   * If this form has not yet been initialized, attaches event listeners.
   * @method
   * @return {this} OfficeMap
   */
  init() {
    if (this._initialized) {
      return this;
    }

    // Set window resize handler for the map.
    $(window).on('resize', () => {
      this._google.maps.event.trigger(this._map, 'resize');
    });

    // Adds handler for highlighting and bouncing a pin when a list item gets
    // focus.
    $(this._el).on('focus', `.${OfficeMap.CssClass.LIST_LOCATION}`, e => {
      const markerId = parseInt($(e.currentTarget).data('marker'), 10);
      const location = _.findWhere(this._locations, {
        id: markerId
      });
      if (location && 'marker' in location) {
        $('html, body').animate({
          scrollTop: `${$(this._mapEl).offset().top}px`
        }, 'fast').promise().then(() => {
          this.centerOnMarker(location.marker);
          $(e.delegateTarget).find(`.${OfficeMap.CssClass.LIST_LOCATION}`)
              .removeClass(OfficeMap.CssClass.ACTIVE);
          $(e.currentTarget).addClass(OfficeMap.CssClass.ACTIVE);
        });
      }
    }).on('click', `.${OfficeMap.CssClass.MORE}`, e => {
      // Hanlder for the 'Show more' button.
      e.preventDefault();
      this.updateList().updateUrl();
    });

    // Attach handler for the autocomplete search box. This updates the map
    // position and re-sorts locations around that position.
    this._searchEl.addEventListener('keyup', event => {
      if(event.target.value) {
        this._service.getPlacePredictions({
           input: event.target.value,
           offset: 3,
           types: ['geocode'],
           componentRestrictions: {country: 'us'},
           bounds: OfficeMap.NYC_BOUNDS
        }, predictions => {
          if(predictions) {
            let results = predictions.map(e => [e['description']]);
            this._inputAutocomplete._autocomplete.options = results;
            const autocompleteSelf = this._inputAutocomplete._autocomplete;

            this._inputAutocomplete._autocomplete.select = () => {
                if (autocompleteSelf.highlightedIndex !== -1) {
                  autocompleteSelf.input.value = autocompleteSelf
                    .scoredOptions[autocompleteSelf.highlightedIndex]
                    .displayValue;
                  autocompleteSelf.removeDropdown();

                  let nameOfLocation = autocompleteSelf.input.value;
                  let googlePlaceObj = this.getGooglePlaceByName(nameOfLocation,
                                                                 predictions);

                  this.displayPlacesOnMap(googlePlaceObj);
                }
              };
            }
        });
      }
    });

    // Initialize the filter control and listen for filter updates.
    this._filter.setPrograms(this._programs).init();
    $(this._filterEl).on(OfficeFilter.Event.UPDATE, () => {
      this._programs = this._filter.getPrograms();
      this.filterLocations().updateUrl().sortByDistance().updateList()
          .updateUrl();
    });

    // Load pin data.
    this.loading(true);

    this.clearLocations(true).fetchLocations().then(() => {
      this.loading(false);
      this.filterLocations().sortByDistance();
      if (Utility.getUrlParameter('lat') || Utility.getUrlParameter('lng') ||
          Utility.getUrlParameter('programs')) {
        // These parameters indicate an initial app state, so update the map
        // and list to reflect that.
        this.updateList().updateUrl();
      } else {
        // If there is no initial application state, open the filter drawer.
        const $filterToggle =
            $(this._el).find(`.${OfficeFilter.CssClass.MAIN_TOGGLE}`);
        if (!$filterToggle.hasClass('active')) {
          $filterToggle.trigger('click');
        }
      }
    });

    this._initialized = true;

    return this;
  }

  /**
   * Clears the map markers, map listing, and, optionally, resets
   * this._locations and this._filteredLocations.
   * @method
   * @param {boolean} reset - True if resetting the entire set.
   * @return {this} OfficeMap
   */
  clearLocations(reset) {
    _.each(this._locations, location => {
      location.marker.setMap(null);
      location.active = false;
    });

    $(this._listEl).empty();

    if (reset) {
      this._locations = [];
      this._filteredLocations = [];
    }

    return this;
  }
  /**
   * Iterates over a list of place objects from Google and
   * display them on the map using PlacesService.
   * @param {object} place
   */
   displayPlacesOnMap(place) {
     if(place) {
         let request = {
            placeId: place.place_id,
            fields: ['name', 'formatted_address', 'place_id', 'geometry']
         };

         const officeMap = this;

         this._placeService.getDetails(request, function(place, status) {
            if (status === 'OK') {
              officeMap._mapPosition = place.geometry.location;
              officeMap._map.panTo(officeMap._mapPosition);
              officeMap.sortByDistance().clearLocations().updateUrl()
                .updateList().updateUrl();
              $(officeMap._searchEl).blur();
            }
         });
     }
   }
   /**
    * Iterates over an array of Google Maps Objects, if the object's description
    * matches the name of the location the Google Map's object is returned.
    * @param {string} nameOfLocation
    * @param {array} listOfGooglePlaces
    * @return {object} Google Map Object
    */
    getGooglePlaceByName(nameOfLocation, listOfGooglePlaces) {
      if (nameOfLocation && listOfGooglePlaces) {
         return listOfGooglePlaces.find(googlePlace =>
          googlePlace.description.match(nameOfLocation)
        );
      }
    }

  /**
   * Updates this._locations based on a given set of parameters. Recursively
   * makes requests to the API until all results are loaded.
   * @method
   * @return {jqXHR} - JSON response.
   */
  fetchLocations() {
    return $.getJSON($(this._el).data('source')).then(data => {
      _.each(data.locations, item => {
        const location = new OfficeLocation(item);
        this._google.maps.event.addListener(location.marker, 'click', () => {
          this.focusListOnMarker(location.marker);
        });
        this._locations.push(location);
      });
    });
  }

  /**
   * Update the list of locations on the map.
   * @method
   * @return {this} OfficeMap
   */
  updateList() {
    // If there are no qualified locations, show "no results".
    if (this._filteredLocations.length === 0) {
      $(this._el).find(OfficeMap.Selectors.MESSAGE_NO_RESULTS)
        .removeClass('hidden')
        .attr('aria-hidden', false);
      $(this._listEl).empty();
      $(this._paginationEl).empty();
      return this;
    }

    // Underscore templates.
    const locationTemplate = $('#map-location-template').html();
    const paginationTemplate = $('#map-pagination-template').html();

    // Determine the set of locations to retrieve based on count.
    const currentCount = $(this._listEl).find('li').length;
    const newCount = Utility.getUrlParameter('count') &&
        parseInt(Utility.getUrlParameter('count'), 10) > currentCount &&
        !(parseInt(Utility.getUrlParameter('count'), 10) < 25) ?
        parseInt(Utility.getUrlParameter('count'), 10) : currentCount + 25;
    const addedLocations = this._filteredLocations
        .slice(currentCount, newCount);

    // For the locations to be added, attach their marker to the map and
    // set them to active.
    _.each(addedLocations, location => {
      location.marker.setMap(this._map);
      location.active = true;
    });

    // Update the list.
    $(this._el).find(OfficeMap.Selectors.MESSAGE_NO_RESULTS)
      .addClass('hidden')
      .attr('aria-hidden', true);
    $(this._listEl).append(_.template(locationTemplate)({
      locations: addedLocations,
      localize: Utility.localize
    }));

    // Update the pagination controller.
    $(this._paginationEl).html(_.template(paginationTemplate)({
      displayedCount: $(this._listEl).find('li').length,
      totalCount: this._filteredLocations.length
    }));

    // Re-zoom the map.
    this.fitMapToPins();

    return this;
  }

  /**
   * Centers the map on the marker and highlights the marker with a bouncing
   * animation.
   * @param {this._google.maps.Marker} marker
   * @return {this} OfficeMap
   */
  centerOnMarker(marker) {
    if (!marker) {
      return this;
    }

    this._map.panTo(marker.getPosition());

    // Bounce the marker once the pan has completed.
    // A single bounce animation is about 700ms, so the animation is set here
    // to last for three bounces (2100ms).
    this._google.maps.event.addListenerOnce(this._map, 'idle', () => {
      marker.setAnimation(this._google.maps.Animation.BOUNCE);
      _.delay(() => {
        marker.setAnimation(null);
      }, 2100);
    });

    return this;
  }

  /**
   * Centers the map on the clicked marker and highlights the accompanying
   * result list item, scrolling either the page or the result list container
   * to the item as appropraite.
   * @method
   * @param {this._google.maps.Marker} marker
   * @return {this} OfficeMap
   */
  focusListOnMarker(marker) {
    if (!marker) {
      return this;
    }

    // Center the map.
    this.centerOnMarker(marker);

    // Highlight the list item related to the marker.
    const $highlightedItem = $(this._el)
        .find(`.${OfficeMap.CssClass.LIST_LOCATION}`)
        .removeClass(OfficeMap.CssClass.ACTIVE)
        .filter(`[data-marker="${marker.id}"]`)
        .addClass(OfficeMap.CssClass.ACTIVE);
    const $resultContainer = $(this._el)
        .find(`.${OfficeMap.CssClass.CONTROLS}`);
    // The result container will have `overflow: scroll` on large viewports.
    // In this case we want to only scroll that control. If the result container
    // does not have `overflow: scroll` then we want to scroll the window.
    let $scrollTarget = $('html, body');
    let scrollPos = $highlightedItem.offset().top;
    // TODO(jjandoc): Is there a better conditional for this?
    if ($resultContainer.css('overflow') === 'auto' ||
        $resultContainer.css('overflow-y') === 'auto') {
      $scrollTarget = $resultContainer;
      scrollPos = $scrollTarget.scrollTop() + $highlightedItem.position().top;
    }
    $scrollTarget.animate({
      scrollTop: `${scrollPos}px`
    }, 'fast');

    return this;
  }
  /**
   * Updates the list of locations based on programs.
   * @method
   * @return {this} OfficeMap
   */
  filterLocations() {
    this.clearLocations();
    this._filteredLocations = [];
    _.each(this._locations, location => {
      if (!this._programs.length || location.hasProgram(this._programs)) {
        this._filteredLocations.push(location);
      }
    });
    return this;
  }

  /**
   * Sort this._filteredLocations by distance of markers to a given point.
   * @method
   * @param {this._google.maps.LatLng} origin
   * @return {this} OfficeMap
   */
  sortByDistance(origin = this._mapPosition) {
    _.each(this._filteredLocations, location => {
      location.distance =
          this._google.maps.geometry.spherical.computeDistanceBetween(origin,
              location.marker.position);
    });
    this._filteredLocations = _.sortBy(this._filteredLocations, 'distance');

    return this;
  }

  /**
   * Updates the query parameters in the URL.
   * @method
   * @return {this} OfficeMap
   */
  updateUrl() {
    if ('replaceState' in window.history) {
      const mapState = {
        lat: this._mapPosition.lat(),
        lng: this._mapPosition.lng()
      };
      if (this._programs.length) {
        mapState.programs = this._programs.join(',');
      }
      const locationCount = _.filter(this._filteredLocations, location =>
          location.active).length;
      if (locationCount) {
        mapState.count = locationCount;
      }
      window.history.replaceState(null, null, `?${$.param(mapState)}`);
    }

    return this;
  }

  /**
   * Sets the zoom level of the map to fit all active markers.
   * @method
   * @return {this} OfficeMap
   */
  fitMapToPins() {
    const bounds = new this._google.maps.LatLngBounds();
    _.each(this._filteredLocations, location => {
      if (location.active) {
        bounds.extend(location.marker.getPosition());
      }
    });
    this._map.fitBounds(bounds);
    return this;
  }

  /**
   * Method for the loading state
   * @param  {boolean} isLoading Wether or not the map is loading
   * @return {this} OfficeMap
   */
  loading(isLoading) {
    if (isLoading) {
      $(this._el).find(OfficeMap.Selectors.MESSAGE_LOADING)
        .removeClass('hidden')
        .attr('aria-hidden', false);
    } else {
      $(this._el).find(OfficeMap.Selectors.MESSAGE_LOADING)
        .addClass('hidden')
        .attr('aria-hidden', true);
    }
    return this;
  }

  // results() {

  // }

}

/**
 * CSS classes used by this component.
 * @enum {string}
 */
OfficeMap.CssClass = {
  ACTIVE: 'active bg-color-yellow-light',
  CONTROLS: 'js-map-controls',
  FILTER: 'js-map-filter',
  LIST_LOCATION: 'js-map-location',
  LOADING: 'loading',
  MAP_BOX: 'js-map-mapbox',
  MORE: 'js-map-more',
  NO_RESULTS: 'no-results',
  PAGINATION: 'js-map-pagination',
  RESULT_CONTAINER: 'js-map-results-container',
  RESULT_LIST: 'js-map-results',
  SEARCH_BOX: 'js-map-searchbox'
};

OfficeMap.Selectors = {
  MESSAGE_LOADING: '[data-js="message-loading"]',
  MESSAGE_NO_RESULTS: '[data-js="message-no-results"]'
};
/**
 * NYC Bound Parameters for Google Maps API
 * @enum {object}
 */
 OfficeMap.NYC_BOUNDS = {
   'south': 40.4773991,
   'west': -74.25908989999999,
   'north': 40.9175771,
   'east': -73.7002721
 };

export default OfficeMap;
