(function () {
'use strict';

app

.directive('huewiBridge', function() {
  return {
    restrict: 'EA',
    templateUrl: 'app/components/huewi-bridge.html',
    controller: 'huewiBridgeController',
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
})

.controller('huewiBridgeController', ['$scope', 'hueConnector', 'Menu', function($scope, hueConnector, Menu) {
  var vm = this;

  vm.hueConnector = hueConnector;
  vm.MyHue = hueConnector.MyHue;
  vm.Menu = Menu;

  vm.ManualBridge = 'localhost:8000';
}]);


})();
