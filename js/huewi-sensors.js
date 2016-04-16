(function () {
"use strict";

angular.module(app.name)

.directive("huewiSensors", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-sensors.html",
    controller: "SensorsController"
  };
})

.controller("SensorsController", function($scope, hueConnector) {
});


})();