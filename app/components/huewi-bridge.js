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
    vm._Details = '-1';
    vm.Details = Details;

    function Details(NewValue) { // Getter/Setter function
      if (angular.isDefined(NewValue))
      if (vm._Details === NewValue)
      vm._Details = '-1'; // Same, Close current Details(-1)
      else vm._Details = NewValue; // Set
      return vm._Details; // Get
    }

  }]);


})();
