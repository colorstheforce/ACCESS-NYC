<?php

/**
 * Program Guide
 *
 * @link /wp-json/wp/v2/programs
 * @author NYC Opportunity
 */

namespace Controller;

use Timber;
use DateTime;
use DateTimeZone;

class Programs extends Timber\Post {
  /**
   * Constructor
   *
   * @return  Object  This
   */
  public function __construct($pid = false) {
    if ($pid) {
      parent::__construct($pid);
    } else {
      parent::__construct();
    }

    $this->category_slug = $this->getCategorySlug();

    $this->category = $this->getCategory();

    $this->status = $this->getStatus();

    $this->icon = $this->getIcon();

    return $this;
  }

  /**
   * Items returned in this object determine what is shown in the WP REST API.
   * Called by 'rest-prepare-posts.php' must use plugin.
   *
   * @return  Array  Items to show in the WP REST API
   */
  public function showInRest() {
    return array(
      'category_slug' => $this->getCategorySlug(),
      'category' => $this->getCategory(),
      'status' => $this->getStatus(),
      'icon' => $this->getIcon()
    );
  }

  /**
   * Return details of the main category for the program
   *
   * @return  Array  The slug and name of the category
   */
  public function getCategory() {
    return array(
      'slug' => $this->getCategorySlug(),
      'name' => $this->terms('programs')[0]->name
    );
  }

  /**
   * Get the slug of the first program category
   *
   * @return  String  The english slug of the program category
   */
  public function getCategorySlug() {
    $cat = $this->terms('programs')[0]->slug;

    $lang = (defined('ICL_LANGUAGE_CODE')) ? ICL_LANGUAGE_CODE : 'en';

    $slug = ($lang != 'en') ? str_replace("-$lang", '', $cat) : $cat;

    return $slug;
  }

  /**
   * Get the details of the program category icon
   *
   * @return  Array  Class and Icon Version
   */
  public function getIcon() {
    return array(
      'class' => $this->getIconClass(),
      'version' => self::ICON_VERSION
    );
  }

  /**
   * Calculate and get the status of the Program
   *
   * @return  Object/Null  Status. If cleared return null.
   */
  public function getStatus() {
    $status = array(
      'type' => $this->custom['program_status_type'],
      'text' => $this->custom['program_status']
    );

    $clear = strtotime($this->custom['program_status_clear_date']);

    $date = new DateTime('now', new DateTimeZone('America/New_York'));
    $now = $date->getTimestamp() + $date->getOffset();

    if ($this->custom['program_status'] && !$clear) {
      return $status;
    }

    if ($clear < $now) {
      return false;
    } else {
      return $status;
    }
  }

  /**
   * Set the icon class based on the program status type ACF field
   *
   * @return  String  The class name of the icon
   */
  public function getIconClass() {
    $type = $this->custom['program_status_type'];

    $key = ($type || isset($type)) ? $type : self::STATUS_DEFAULT;

    return self::ICON_COLORS[$key];
  }

  /**
   * Constants
   */

  const STATUS_DEFAULT = 'info';

  /** Version of icons to use (sets the postfix) */
  const ICON_VERSION = '2';

  /** Icon color setting for each status */
  const ICON_COLORS = array(
    'info' => 'text-blue-bright fill-blue-light',
    'success' => 'text-green fill-green-light',
    'warning' => 'text-yellow-access fill-yellow-light',
    'urgent' => 'text-red fill-pink-light',
    'covid-response' => 'text-covid-response fill-covid-response-light',
  );
}