(function() {

  var app = angular.module('huewi', ['ngAnimate']);
  var MyHue = new huepi();
  MyHue.Username = '085efe879ee3ed83c04efc28a0da03d3';

  //delete localStorage.MyHueBridgeIP; // Force PortalDiscoverLocalBridges

  app.controller('HueStatusController', function($scope) {
    self = this; // Calling Async Functions looses this... Fix: Store this in self for later reference
    this.MyHue = MyHue; // to be called via angular.element(document.getElementById('HueStatus')).controller().MyHue. in HTML
    this.BridgeIP = '';
    this.BridgeName = '';
    this.Status = '';

    this.ConnectToHueBridge = function() {
      if (!localStorage.MyHueBridgeIP) { // No Cached BridgeIP?
        self.Status = 'Trying to Discover Bridge via Portal';
        $scope.$apply();
        MyHue.PortalDiscoverLocalBridges().then(function GetBridgeConfig() {
          MyHue.BridgeGetData().then(function EnsureWhitelisting() {
            self.BridgeIP = MyHue.BridgeIP;
            if (!MyHue.BridgeUsernameWhitelisted) {
              self.Status = 'Please press connect button on Bridge';
              $scope.$apply();
              MyHue.BridgeCreateUser().then(function ReReadBridgeConfiguration() {
                return;
              }, function UnableToCreateUseronBridge() {
                self.Status = 'Unable to Create User on Bridge';
                $scope.$apply();
                return;
              });
            } else {
              localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
              self.BridgeName = MyHue.BridgeName;
              self.Status = 'Connected';
              $scope.$apply();
            }
          }, function UnableToRetreiveBridgeConfiguration() {
            self.Status = 'Unable to Retreive Bridge Configuration';
            $scope.$apply();
            return;
          });
        }, function UnableToDiscoverLocalBridgesViaPortal() {
          self.Status = 'Unable to find Local Bridge via Portal';
          $scope.$apply();
          return;
        });
      } else {
        MyHue.BridgeIP = localStorage.MyHueBridgeIP;
        self.BridgeIP = MyHue.BridgeIP;
        MyHue.BridgeGetData().then(function CheckWhitelisting() {
          if (MyHue.BridgeUsernameWhitelisted) {
            self.BridgeName = MyHue.BridgeName;
            self.Status = 'Connected';
            $scope.$apply();
          } else {
            delete localStorage.MyHueBridgeIP;
            self.Status = 'Not Whitelisted anymore';
            $scope.$apply();
            return;
          }
        }, function ErrorGettingCachedBridgeData() {
          delete localStorage.MyHueBridgeIP;
          self.Status = 'Not found anymore';
          $scope.$apply();
          return;
        });
      }
    }
  });

  function ToHexString(In) {
    var Result = Math.floor(In).toString(16);
    return Result.length == 1 ? "0" + Result : Result;
  }

  app.directive("huewiGroup", function() {
    return {
      restrict: 'E',
      templateUrl: "huewi-group.html"
    };
  });

  app.controller('GroupsController', function($scope) {
    this.Groups = [{'name': 'All available lights', HTMLColor: "#ffcc88"}, {'name': 'Group'}];

    this.Update = function() {
      this.Groups = _.toArray(MyHue.Groups);
      this.Groups.unshift({'name': 'All available lights'});

      _.each(this.Groups, function(Group) {
        var RGB;
        if (Group.action) { // Group 0 (All available lights) doesn't have properties
          if (Group.action.colormode === 'hs') {
            RGB = huepi.HelperHueAngSatBritoRGB(Group.action.hue * 360 / 65535, Group.action.sat / 255, Group.action.bri / 255);
            var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
            RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Group.modelid, Group.action.bri / 255);
          } else if (Group.action.colormode === 'xy') {
            RGB = huepi.HelperXYtoRGBforModel(Group.action.xy[0], Group.action.xy[1], "LCT001", Group.action.bri / 255);
          } else if (Group.action.colormode === 'ct') {
            RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / Group.action.ct));
            var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
            RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Group.modelid, Group.action.bri / 255);
          }
          Group.HTMLColor = "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
        } else Group.HTMLColor = "#ffcc88";
      })
      $scope.$apply();
    }
  })

  app.directive("huewiLight", function() {
    return {
      restrict: 'E',
      templateUrl: "huewi-light.html"
    };
  });

  app.controller('LightsController', function($scope) {
    this.Lights = [{'name': 'Light'}, {'name': 'Light'}, {'name': 'Light'}];

    this.Update = function() {
      this.Lights = _.toArray(MyHue.Lights);
      _.each(this.Lights, function(Light) {
        var RGB;
        if (Light.state.colormode === 'hs') {
          RGB = huepi.HelperHueAngSatBritoRGB(Light.state.hue * 360 / 65535, Light.state.sat / 255, Light.state.bri / 255);
          var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
          RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Light.modelid, Light.state.bri / 255);
        } else if (Light.state.colormode === 'xy') {
          RGB = huepi.HelperXYtoRGBforModel(Light.state.xy[0], Light.state.xy[1], Light.modelid, Light.state.bri / 255);
        } else if (Light.state.colormode === 'ct') {
          RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / Light.state.ct));
          var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
          RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, Light.modelid, Light.state.bri / 255);
        }
        Light.HTMLColor = "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
      })
      $scope.$apply();
    }
  });

  app.controller('MenuController', function($scope) {
    this.Item ="None";
    this.SetItem = function(NewItem, NewIndex) {
      this.Item = NewItem;
      if (NewItem === 'Group')
        angular.element(document.getElementById('Group')).controller().SetGroupNr(NewIndex);
      else if (NewItem === 'Light')
        angular.element(document.getElementById('Light')).controller().SetLightNr(NewIndex);
    }
  });

  app.controller('GroupController', function($scope) {
    this.GroupNr = 0;
    this.SetGroupNr = function(NewGroupNr) {
      this.GroupNr = NewGroupNr;
    }
  });
  app.controller('LightController', function($scope) {
    this.LightNr = 1;
    this.SetLightNr = function(NewLightNr) {
      this.LightNr = NewLightNr;
    }
  });

  app.controller('SchedulesController', function($scope) {
  });
  app.controller('ScenesController', function($scope) {
  });
  app.controller('SensorsController', function($scope) {
  });
  app.controller('RulesController', function($scope) {
  });
  app.controller('BridgeController', function($scope) {
  });


})();
