(function () {
"use strict";

angular.module(app.name)

.directive("huewiScenes", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-scenes.html",
    controller: "ScenesController"
  };
})

.controller("ScenesController", function($scope, hueConnector) {
});


})();