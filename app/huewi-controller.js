(function () {
  'use strict';

  app

  .controller('huewiController', ['$rootScope', '$scope', 'hueConnector', 'Menu', function($rootScope, $scope, hueConnector, Menu) {
    var vm = this;

    vm.hueConnector = hueConnector;
    vm.MyHue = hueConnector.MyHue;
    vm.Menu = Menu;
    vm.BackbuttonPressed = BackbuttonPressed; // For Debugging TESTCODE

    window.hue = hueConnector.MyHue; // For Debugging TESTCODE

    if (window.cordova) {
      document.addEventListener('deviceready', function () {
        document.addEventListener('pause', vm.hueConnector.Pause, false);
        document.addEventListener('resume', vm.hueConnector.Resume, false);
        document.addEventListener('backbutton', BackbuttonPressed, false);
        $('#fadeafterloading').fadeOut(1234,'swing');
        vm.hueConnector.Startup();
      }, false);
    } else {
      $('#fadeafterloading').fadeOut(1234,'swing');
      $(document).ready(vm.hueConnector.Startup);
    }

    function BackbuttonPressed() {
      if (vm.Menu.GetItem() === 'QuitOnBack') {
        if (navigator.app) {
          navigator.app.exitApp();
        } else if (navigator.device) {
          navigator.device.exitApp();
        } else {
          window.close();
        }
      } else if (vm.Menu.GetItem() === '') {
        vm.Menu.SetItem('QuitOnBack');
        setTimeout(function() {
          $rootScope.$apply(); // Force UI update
        }, 1);
        setTimeout(function() {
          if (vm.Menu.GetItem() === 'QuitOnBack')
          vm.Menu.SetItem('');
          $rootScope.$apply(); // Force UI update
        }, 2500);
      } else if (vm.Menu.GetItem() !== '') {
        vm.Menu.SetItem('Escape');
        setTimeout(function() {
          $rootScope.$apply(); // Force UI update
        }, 1);
        setTimeout(function() {
          if (vm.Menu.GetItem() === 'Escape')
          vm.Menu.SetItem('');
          $rootScope.$apply(); // Force UI update
        }, 100);
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
      if ((NewItem === '') || (NewItem === 'Escape') || (NewItem === 'QuitOnBack')) // No Overlay selected
      $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
      else $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>
    });

    document.onkeyup = function(event) {
      if (vm.Menu.GetItem() !== '') {
        if ((event.keyCode === 27)) { // Escape will close open Overlays.
          BackbuttonPressed();
        }
      }
    };

  }]);


})();
