(function () {
"use strict";

app

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