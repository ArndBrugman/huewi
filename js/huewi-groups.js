(function () {
"use strict";
  
app

.directive("huewiGroups", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-groups.html",
    controller: "huewiGroupsController"
  };
})

.controller("huewiGroupsController", ["$scope", "hueConnector", function($scope, hueConnector) {
  $scope.GroupType = "Room"; // LightGroup or Room

  $scope.ChangeType = function()
  {
    if ($scope.GroupType === "LightGroup") {
      $scope.GroupType = "Room";
    } else {
      $scope.GroupType = "LightGroup";
    }
  };
}]);


})();