(function () {
  'use strict';

  app

  .controller('huewiController', ['$rootScope', '$scope', 'hueConnector', 'Menu', function($rootScope, $scope, hueConnector, Menu) {
    var vm = this;

    vm.hueConnector = hueConnector;
    vm.MyHue = hueConnector.MyHue;
    vm.Menu = Menu;

    window.hue = hueConnector.MyHue; // For Debugging TESTCODE

    if (window.cordova) {
      document.addEventListener('deviceready', function () {
        document.addEventListener('pause', vm.hueConnector.Pause, false);
        document.addEventListener('resume', vm.hueConnector.Resume, false);
        document.addEventListener('backbutton', BackbuttonPressed, false);
        vm.hueConnector.Startup();
      }, false);
    } else {
      $(document).ready(vm.hueConnector.Startup);
    }

    function BackbuttonPressed() {
      if (vm.Menu.GetItem() !== '') {
        vm.Menu.SetItem('Escape');
        setTimeout(function() {
          try {
            $rootScope.$apply(); // Force UI update
          } catch (error) {}
        }, 1);
        setTimeout(function() {
          vm.Menu.SetItem('');
        }, 16)
      } else {
        if (navigator.app) {
          navigator.app.exitApp();
        } else if (navigator.device) {
          navigator.device.exitApp();
        } else {
          window.close();
        }
      }
    }

    $scope.$watch(function() {
      return vm.hueConnector.GetStatus();
    }, function WatchStatus(NewStatus, OldStatus) {
      if (NewStatus!=='Connected') {
        $('#huewiStatusbar').slideDown(350);
      } else {
        setTimeout(function() { $('#huewiStatusbar').slideUp(750); }, 1);
      }
    });

    $scope.$watch(function() {
      return vm.Menu.GetItem();
    }, function WatchStatus(NewItem, OldItem) {
      if (NewItem === '') // No Overlay selected
      $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
      else $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>
    });

    document.onkeyup = function(event) {
      if (vm.Menu.GetItem() !== '') {
        if ((event.keyCode === 27)) { // Escape will close open Overlays.
          vm.Menu.SetItem('Escape');
          setTimeout(function() {
            try {
              $rootScope.$apply(); // Force UI update
            } catch (error) {}
          }, 1);
        }
      }
    };

  }]);


})();
