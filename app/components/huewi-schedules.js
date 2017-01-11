(function () {
"use strict";

app

.directive("huewiSchedules", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-schedules.html",
    controller: "huewiSchedulesController",
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
})

.controller("huewiSchedulesController", ["$scope", "hueConnector", "Menu", function($scope, hueConnector, Menu) {
  var vm = this;

  vm.MyHue = hueConnector.MyHue;
  vm.Menu = Menu;
  
  vm.Filter = "";
  vm._Details = "-1";
  vm.Details = Details;

  function Details(NewValue) { // Getter/Setter function
    if (angular.isDefined(NewValue))
      if (vm._Details === NewValue)
       vm._Details = "-1"; // Same, Close current Details(-1)
      else vm._Details = NewValue; // Set
    return vm._Details; // Get
  };

}]);


})();