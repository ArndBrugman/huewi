(function () {
"use strict";

app

.directive("huewiScenes", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-scenes.html",
    controller: "huewiScenesController"
  };
})

.controller("huewiScenesController", function($scope, hueConnector) {
});


})();