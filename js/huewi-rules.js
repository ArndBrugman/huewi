(function () {
"use strict";

angular.module(app.name)

.directive("huewiRules", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-rules.html",
    controller: "RulesController"
  };
})

.controller("RulesController", function($scope, hueConnector) {
});


})();