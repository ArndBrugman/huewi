(function () {
"use strict";

app

.directive("huewiSchedules", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-schedules.html",
    controller: "huewiSchedulesController"
  };
})

.controller("huewiSchedulesController", ["$scope", "hueConnector", function($scope, hueConnector) {
	$scope.ScheduleFilter='';
}]);


})();