(function () {
"use strict";

app

.directive("huewiBridge", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-bridge.html",
    controller: "huewiBridgeController"
  };
})

.controller("huewiBridgeController", ["$scope", "hueConnector", function($scope, hueConnector) {
  $scope.ManualBridge = "localhost:8000";
}]);


})();