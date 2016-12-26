(function () {
"use strict";

app

.directive("huewiAbout", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-about.html",
    controller: "huewiAboutController"
  };
})

.controller("huewiAboutController", ["$scope", "hueConnector", function($scope, hueConnector) {
  $scope.version = '1.x';
  $scope.angular = angular;
}]);


})();