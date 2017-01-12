(function () {
'use strict';

app

.controller('huewiController', ['$rootScope', '$scope', 'hueConnector', 'Menu', function($rootScope, $scope, hueConnector, Menu) {
  var vm = this;

  vm.hueConnector = hueConnector;
  vm.MyHue = hueConnector.MyHue;
  vm.Menu = Menu;

  window.hue = hueConnector.MyHue; // For Debugging TESTCODE

  $scope.$watch(function() {
    return vm.hueConnector.GetStatus();
    }, function WatchStatus(NewStatus, OldStatus) {
      if (NewStatus!=='Connected')
        $('#HueStatusbar').slideDown(350);
      else setTimeout(function() { $('#HueStatusbar').slideUp(750); }, 1);
    }
  );

  $scope.$watch(function() {
    return vm.Menu.GetItem();
    }, function WatchStatus(NewItem, OldItem) {
      if (NewItem === '') // No Overlay selected
        $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
      else $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>
    }
  );

  document.addEventListener('backbutton', function(event) { // Cordova/PhoneGap only.
    if (vm.Menu.Get() !== '') {
      vm.Menu.Set('Escape');
      setTimeout(function() { $rootScope.$apply(); }, 1); // Force UI update
    }
  });

  document.onkeyup = function(event) {
    if (vm.Menu.GetItem() !== '') {
      // Escape will close open Overlays.
      if ((event.keyCode === 27)) { // Escape
        vm.Menu.SetItem('Escape');
        setTimeout(function() { $rootScope.$apply(); }, 1); // Force UI update
      }
    }
  };

}]);


})();
