(function () {
"use strict";

app

.directive("huewiRules", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-rules.html",
    controller: "huewiRulesController"
  };
})

.controller("huewiRulesController", function($scope, hueConnector) {
});


})();