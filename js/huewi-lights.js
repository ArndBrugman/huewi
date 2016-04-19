(function () {
"use strict";

app

.directive("huewiLights", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-lights.html",
    controller: "huewiLightsController"
  };
})

.controller("huewiLightsController", ["$scope", "hueConnector", function($scope, hueConnector) {
}]);


})();