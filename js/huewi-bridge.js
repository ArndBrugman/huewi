(function () {
"use strict";

angular.module(app.name)

.directive("huewiBridge", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-bridge.html",
    controller: "huewiBridgeController"
  };
})

.controller("huewiBridgeController", function($scope, hueConnector) {
  $scope.ManualBridge = "localhost:8000";
});


})();