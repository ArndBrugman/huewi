(function () {
"use strict";

app

.directive("huewiSensors", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-sensors.html",
    controller: "huewiSensorsController"
  };
})

.controller("huewiSensorsController", ["$scope", "hueConnector", function($scope, hueConnector) {
}]);


})();