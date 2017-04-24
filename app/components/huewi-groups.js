(function () {
  'use strict';

  app

  .directive('huewiGroups', function() {
    return {
      restrict: 'EA',
      templateUrl: 'app/components/huewi-groups.html',
      controller: 'huewiGroupsController',
      controllerAs: 'vm',
      scope: {},
      bindToController: true
    };
  })

  .controller('huewiGroupsController', ['$scope', 'hueConnector', 'Menu', function($scope, hueConnector, Menu) {
    var vm = this;

    vm.MyHue = hueConnector.MyHue;
    vm.Menu = Menu;

    vm.GroupType = 'Room'; // LightGroup or Room
    vm.GroupId = '-1';

    vm.ChangeType = ChangeType;
    vm.FilterGroups = FilterGroups;
    vm.SetGroupId = SetGroupId;
    vm.SetGroupBrightness = SetGroupBrightness;

    vm.UpdateScheduled = false;

    function ChangeType()
    {
      if (vm.GroupType === 'RoomsAndGroups') {
        vm.GroupType = 'Room';
      } else if (vm.GroupType === 'Room') {
        vm.GroupType = 'LightGroup';
      } else {
        vm.GroupType = 'RoomsAndGroups';
      }
    }

    function FilterGroups(Group)
    {
      if (vm.GroupType === 'RoomsAndGroups') {
        return true;
      }
      return Group.type === vm.GroupType;
    }

    function SetGroupId(NewId) {
      vm.GroupId = NewId;
    }

    function SetGroupBrightness(CurrentGroup) {
      //if (vm.GroupId ==='-1')
      //return;
      if ((vm.UpdateScheduled === false) && (CurrentGroup))
      {
        vm.UpdateScheduled = true;
        setTimeout(function(){vm.UpdateScheduled = false;},50);
        vm.MyHue.GroupSetBrightness(CurrentGroup, vm.MyHue.Groups[CurrentGroup].action.bri, 2).then(function(value) {
        }, function(reason) {
        });
      }
    }

  }]);


})();
