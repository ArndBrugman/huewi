(function () {
"use strict";

app

.directive("huewiSensors", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-sensors.html",
    controller: "huewiSensorsController"
  };
})

.controller("huewiSensorsController", function($scope, hueConnector) {
});


})();