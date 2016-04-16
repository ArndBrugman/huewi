(function () {
"use strict";
  
angular.module(app.name)

.directive("huewiGroups", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-groups.html",
    controller: "huewiGroupsController"
  };
})

.controller("huewiGroupsController", function($scope, hueConnector) {
  $scope.GroupType = "LightGroup"; // LightGroup or Room

  $scope.ChangeType = function()
  {
    if ($scope.GroupType === "LightGroup") {
      $scope.GroupType = "Room";
    } else {
      $scope.GroupType = "LightGroup";
    }
  };
});


})();