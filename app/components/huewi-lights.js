(function () {
"use strict";

app

.directive("huewiLights", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-lights.html",
    controller: "huewiLightsController",
    controllerAs: 'vm',
    scope: {},
    bindToController: true
  };
})

.controller("huewiLightsController", ["$scope", "hueConnector", "Menu", function($scope, hueConnector, Menu) {
  var vm = this;

  vm.MyHue = hueConnector.MyHue;
  vm.Menu = Menu;

  vm.LightId = "-1";

  vm.SetLightId = SetLightId;
  vm.SetLightBrightness = SetLightBrightness;

  vm.UpdateScheduled = false;

  function SetLightId(NewId) {
    vm.LightId = NewId;
  }

  function SetLightBrightness(CurrentLight) {
    if (vm.LightId ==='-1') 
      return;
    if (vm.UpdateScheduled === false)
    {
      vm.UpdateScheduled = true;
      vm.MyHue.LightSetBrightness(CurrentLight, vm.MyHue.Lights[CurrentLight].state.bri, 2).then(function(value) {
        setTimeout(function(){vm.UpdateScheduled = false;},50);
      }, function(reason) {
        setTimeout(function(){vm.UpdateScheduled = false;},50);
      });
    }
  };

}]);


})();