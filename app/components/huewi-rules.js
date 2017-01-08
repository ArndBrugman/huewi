(function () {
"use strict";

app

.directive("huewiRules", function () {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-rules.html",
    controller: "huewiRulesController"
  };
})

.controller("huewiRulesController", ["$scope", "hueConnector", function($scope, hueConnector) {
	 $scope.RuleFilter='';
   $scope._Details = "-1";

	 $scope.Details = function (NewValue) { // Getter/Setter function
    if (angular.isDefined(NewValue))
      if ($scope._Details === NewValue)
       $scope._Details = "-1"; // Same, Close current Details(-1)
      else $scope._Details = NewValue; // Set
    return $scope._Details; // Get
  };

}]);


})();
