<?php

/**
 * This code was generated by
 * \ / _    _  _|   _  _
 * | (_)\/(_)(_|\/| |(/_  v1.0.0
 * /       /
 */

namespace Twilio\Rest\Taskrouter\V1\Workspace\TaskQueue;

use Twilio\ListResource;
use Twilio\Options;
use Twilio\Values;
use Twilio\Version;

class TaskQueuesStatisticsList extends ListResource {
    /**
     * Construct the TaskQueuesStatisticsList
     * 
     * @param Version $version Version that contains the resource
     * @param string $workspaceSid The workspace_sid
     * @return \Twilio\Rest\Taskrouter\V1\Workspace\TaskQueue\TaskQueuesStatisticsList 
     */
    public function __construct(Version $version, $workspaceSid) {
        parent::__construct($version);
        
        // Path Solution
        $this->solution = array(
            'workspaceSid' => $workspaceSid,
        );
        
        $this->uri = '/Workspaces/' . rawurlencode($workspaceSid) . '/TaskQueues/Statistics';
    }

    /**
     * Streams TaskQueuesStatisticsInstance records from the API as a generator
     * stream.
     * This operation lazily loads records as efficiently as possible until the
     * limit
     * is reached.
     * The results are returned as a generator, so this operation is memory
     * efficient.
     * 
     * @param array|Options $options Optional Arguments
     * @param int $limit Upper limit for the number of records to return. stream()
     *                   guarantees to never return more than limit.  Default is no
     *                   limit
     * @param mixed $pageSize Number of records to fetch per request, when not set
     *                        will use the default value of 50 records.  If no
     *                        page_size is defined but a limit is defined, stream()
     *                        will attempt to read the limit with the most
     *                        efficient page size, i.e. min(limit, 1000)
     * @return \Twilio\Stream stream of results
     */
    public function stream($options = array(), $limit = null, $pageSize = null) {
        $limits = $this->version->readLimits($limit, $pageSize);
        
        $page = $this->page($options, $limits['pageSize']);
        
        return $this->version->stream($page, $limits['limit'], $limits['pageLimit']);
    }

    /**
     * Reads TaskQueuesStatisticsInstance records from the API as a list.
     * Unlike stream(), this operation is eager and will load `limit` records into
     * memory before returning.
     * 
     * @param array|Options $options Optional Arguments
     * @param int $limit Upper limit for the number of records to return. read()
     *                   guarantees to never return more than limit.  Default is no
     *                   limit
     * @param mixed $pageSize Number of records to fetch per request, when not set
     *                        will use the default value of 50 records.  If no
     *                        page_size is defined but a limit is defined, read()
     *                        will attempt to read the limit with the most
     *                        efficient page size, i.e. min(limit, 1000)
     * @return TaskQueuesStatisticsInstance[] Array of results
     */
    public function read($options = array(), $limit = null, $pageSize = Values::NONE) {
        return iterator_to_array($this->stream($options, $limit, $pageSize), false);
    }

    /**
     * Retrieve a single page of TaskQueuesStatisticsInstance records from the API.
     * Request is executed immediately
     * 
     * @param array|Options $options Optional Arguments
     * @param mixed $pageSize Number of records to return, defaults to 50
     * @param string $pageToken PageToken provided by the API
     * @param mixed $pageNumber Page Number, this value is simply for client state
     * @return \Twilio\Page Page of TaskQueuesStatisticsInstance
     */
    public function page($options = array(), $pageSize = Values::NONE, $pageToken = Values::NONE, $pageNumber = Values::NONE) {
        $options = new Values($options);
        $params = Values::of(array(
            'EndDate' => $options['endDate'],
            'FriendlyName' => $options['friendlyName'],
            'Minutes' => $options['minutes'],
            'StartDate' => $options['startDate'],
            'PageToken' => $pageToken,
            'Page' => $pageNumber,
            'PageSize' => $pageSize,
        ));
        
        $response = $this->version->page(
            'GET',
            $this->uri,
            $params
        );
        
        return new TaskQueuesStatisticsPage($this->version, $response, $this->solution);
    }

    /**
     * Provide a friendly representation
     * 
     * @return string Machine friendly representation
     */
    public function __toString() {
        return '[Twilio.Taskrouter.V1.TaskQueuesStatisticsList]';
    }
}