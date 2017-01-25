(function () {
  'use strict';

  app

  .directive('huewiAbout', function() {
    return {
      restrict: 'EA',
      templateUrl: 'huewi-about.html',
      controller: 'huewiAboutController',
      controllerAs: 'vm',
      scope: {},
      bindToController: true
    };
  })

  .controller('huewiAboutController', ['$scope', 'hueConnector', 'Menu', function($scope, hueConnector, Menu) {
    var vm = this;

    vm.MyHue = hueConnector.MyHue;
    vm.Menu = Menu;

    vm.Version = '1.x';
    vm.AngularVersion = angular.version;

  }]);


})();
