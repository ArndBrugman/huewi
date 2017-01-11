(function () {
"use strict";

app

.directive("huewiScenes", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-scenes.html",
    controller: "huewiScenesController",
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
})

.controller("huewiScenesController", ["$scope", "hueConnector", "Menu", function($scope, hueConnector, Menu) {
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