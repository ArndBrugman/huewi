(function () {
"use strict";

angular.module(app.name)

.directive("huewiSchedules", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-schedules.html",
    controller: "huewiSchedulesController"
  };
})

.controller("huewiSchedulesController", function($scope, hueConnector) {
});


})();