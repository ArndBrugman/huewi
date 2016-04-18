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

.controller("huewiLightsController", function($scope, hueConnector) {
});


})();