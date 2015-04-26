  var app = angular.module('huewi', ['ngAnimate']);
  var MyHue = new huepi();
  MyHue.Username = '085efe879ee3ed83c04efc28a0da03d3';

  angular.module('huewi').factory('Data', function () {
    var _MyHue = new huepi();
    _MyHue.Username = '085efe879ee3ed83c04efc28a0da03d3';
    return {
        MyHue: function () {
          return _MyHue;
        }
    }
  });

//delete localStorage.MyHueBridgeIP; // Force PortalDiscoverLocalBridges TESTCODE.

  angular.module('huewi').controller('HueStatusController', ['$scope', function($scope) {
    $scope.MyHue = MyHue; // to be called via $('#HueStatus').scope().MyHue. in HTML
    $scope.BridgeIP = '';
    $scope.BridgeName = '';
    $scope.Status = '';

    $scope.ConnectToHueBridge = function() {
      if (!localStorage.MyHueBridgeIP) { // No Cached BridgeIP?
        $scope.Status = 'Trying to Discover Bridge via Portal';
        $scope.$apply();
        MyHue.PortalDiscoverLocalBridges().then(function GetBridgeConfig() {
          MyHue.BridgeGetData().then(function EnsureWhitelisting() {
            $scope.BridgeIP = MyHue.BridgeIP;
            if (!MyHue.BridgeUsernameWhitelisted) {
              $scope.Status = 'Please press connect button on Bridge';
              $scope.$apply();
              MyHue.BridgeCreateUser().then(function ReReadBridgeConfiguration() {
                return;
              }, function UnableToCreateUseronBridge() {
                $scope.Status = 'Unable to Create User on Bridge';
                $scope.$apply();
                return;
              });
            } else {
              localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
              $scope.BridgeName = MyHue.BridgeName;
              $scope.Status = 'Connected';
              $scope.$apply();
//MyHue.BridgeDeleteUser(MyHue.Username); // Force buttonpress on next Startup TESTCODE.
            }
          }, function UnableToRetreiveBridgeConfiguration() {
            $scope.Status = 'Unable to Retreive Bridge Configuration';
            $scope.$apply();
            return;
          });
        }, function UnableToDiscoverLocalBridgesViaPortal() {
          $scope.Status = 'Unable to find Local Bridge via Portal';
          $scope.$apply();
          return;
        });
      } else {
        MyHue.BridgeIP = localStorage.MyHueBridgeIP;
        $scope.BridgeIP = MyHue.BridgeIP;
        MyHue.BridgeGetData().then(function CheckWhitelisting() {
          if (MyHue.BridgeUsernameWhitelisted) {
            $scope.BridgeName = MyHue.BridgeName;
            $scope.Status = 'Connected';
            $scope.$apply();
          } else {
            delete localStorage.MyHueBridgeIP;
            $scope.Status = 'Not Whitelisted anymore';
            $scope.$apply();
            return;
          }
        }, function ErrorGettingCachedBridgeData() {
          delete localStorage.MyHueBridgeIP;
          $scope.Status = 'Not found anymore';
          $scope.$apply();
          return;
        });
      }
    }

    $scope.Update = function() {
      var Result = MyHue.BridgeGetData();
      return Result;
    }
  }]);

  function ToHexString(In) {
    var Result = Math.floor(In).toString(16);
    return Result.length == 1 ? "0" + Result : Result;
  }

  angular.module('huewi').directive("huewiGroup", function() {
    return {
      restrict: 'E',
      templateUrl: "huewi-group.html"
    };
  });

  angular.module('huewi').controller('GroupsController', ['$scope', function($scope) {
    $scope.Groups = [{'name': 'All available lights', HTMLColor: "#ffcc88"}, {'name': 'Group1'}, {'name': 'Group2'}, {'name': 'Group3'}];

    $scope.Update = function() {
      $scope.Groups = _.toArray(MyHue.Groups);
      $scope.Groups.unshift({'name': 'All available lights'});

      _.each($scope.Groups, function(Group) {
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
  }]);

  angular.module('huewi').directive("huewiLight", function() {
    return {
      restrict: 'E',
      templateUrl: "huewi-light.html"
    };
  });

  angular.module('huewi').controller('LightsController', ['$scope', function($scope) {
    $scope.Lights = [{'name': 'Light1'}, {'name': 'Light2'}, {'name': 'Light3'}];

    $scope.Update = function() {
      $scope.Lights = _.toArray(MyHue.Lights);
      _.each($scope.Lights, function(Light) {
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
  }]);

  angular.module('huewi').controller('MenuController', ['$scope', function($scope) {
    $scope.MenuItem ='Connecting';
    
    $scope.SetMenuItem = function(NewItem, NewIndex) {
      //console.log('Menu->SetMenuItem '+NewItem+', '+NewIndex);
      $scope.MenuItem = NewItem;
      if ($scope.MenuItem === '') // No Overlay selected
        $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
      else
        $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>

      if (NewItem === 'Group')
        $('#Group').scope().Update(NewIndex);
      else if (NewItem === 'Light')
        $('#Light').scope().Update(NewIndex);
    }
  }]);

  angular.module('huewi').controller('TabController', ['$scope', function($scope) {
    $scope.Tab = 1;

    $scope.TabIsSet = function(CheckTab) {
      return $scope.Tab === CheckTab;
    }
    $scope.SetTab = function(SetTab) {
      $scope.Tab = SetTab;
    }
    $scope.GetTab = function() {
      return $scope.Tab;
    }
  }]);
  
  angular.module('huewi').controller('GroupController', ['$scope', function($scope) {
    var hueImage = new Image();
    hueImage.src = 'img/hue.png';
    var ctImage = new Image();
    ctImage.src = 'img/ct.png';
    $scope.Index = 0; // Zerobased Index, Group 0 is All
    $scope._Name = '';
    $scope.OrgName = $scope._Name;

    hueImage.onload = function() {
      $('#Group').scope().Redraw();
    };

    ctImage.onload = function() {
      $('#Group').scope().Redraw();
    };

    $(window).resize(function(){
      $('#Group').scope().Redraw();
    });

    $scope.Redraw = function() {
      var hueCanvas = document.getElementById('hueGroupCanvas');
      var hueContext = hueCanvas.getContext('2d');
      var ctCanvas = document.getElementById('ctGroupCanvas');
      var ctContext = ctCanvas.getContext('2d');
      // Canvas size should be set by script not css, otherwise getting HueImagePixel doesn't match canvas sizes
      if ($(window).width() > $(window).height()) {
        hueCanvas.width = 0.45 * $(window).width(); // Landscape
      } else {
        hueCanvas.width = 0.45 * $(window).height(); // Portrait
        if (hueCanvas.width > 0.75 * $(window).width())
          hueCanvas.width = 0.75 * $(window).width();
      }
      hueCanvas.height = hueCanvas.width;
      hueContext.drawImage(hueImage, 0, 0, hueCanvas.width, hueCanvas.height); // ReDraw
      ctCanvas.width = hueCanvas.width;
      ctCanvas.height = ctCanvas.width / 2;
      ctContext.drawImage(ctImage, 0, 0, ctCanvas.width, ctCanvas.height); // ReDraw
    }

    $('#hueGroupCanvas').on('click', function(event) {
      var x = event.offsetX;
      var y = event.offsetY;
      var HueContext = document.getElementById('hueGroupCanvas').getContext('2d');
      var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
      var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
      MyHue.GroupSetRGB($scope.Index, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    });

    $('#ctGroupCanvas').on('click', function(event) { // 2000..6500
      var ctGroupCanvas = document.getElementById('ctGroupCanvas');
      var x = event.offsetX;
      var y = event.offsetY;
      var ColorTemperature = 2000 + (6500-2000)*(x/ctGroupCanvas.width);
      var Brightness = 255 - 255*(y/ctGroupCanvas.height);
      MyHue.GroupSetColortemperature($scope.Index, ColorTemperature);
      MyHue.GroupSetBrightness($scope.Index, Brightness);
    });

    $scope.Update = function(NewGroupNr) {
      var GroupArray = _.toArray(MyHue.Groups);
      GroupArray.unshift({'name': 'All available lights'}); // Group 0 is All
      $scope.Index = NewGroupNr;
      //console.log('Group->Update '+$scope.Index);
      if ($scope.Index < GroupArray.length)
        $scope.OrgName = $scope._Name = GroupArray[$scope.Index].name;
      else $scope._Name = "Group" + $scope.Index;
    }

    $scope.Name = function(NewName) { // Getter/Setter function
      if (angular.isDefined(NewName)) { // Setter
        //console.log('Group.Name.SETter');
        return $scope._Name = NewName;
      } else { // Getter
        //console.log('Group.Name.geTTer');
        return $scope._Name;
      }
    }
  }]);
  
  angular.module('huewi').controller('LightController', ['$scope', function($scope) {
    var hueImage = new Image();
    hueImage.src = 'img/hue.png';
    var ctImage = new Image();
    ctImage.src = 'img/ct.png';
    $scope.Index = 1; // Onebased Index, Light 0 doesn't exist
    $scope._Name = '';
    $scope.OrgName = $scope._Name;
    
    hueImage.onload = function() {
      $('#Light').scope().Redraw();
    };

    ctImage.onload = function() {
      $('#Light').scope().Redraw();
    };

    $(window).resize(function(){
     $('#Light').scope().Redraw();
    });

    $scope.Redraw = function() {
      var hueCanvas = document.getElementById('hueLightCanvas');
      var hueContext = hueCanvas.getContext('2d');
      var ctCanvas = document.getElementById('ctLightCanvas');
      var ctContext = ctCanvas.getContext('2d');
      // Canvas size should be set by script not css, otherwise getting HueImagePixel doesn't match canvas sizes
      if ($(window).width() > $(window).height()) {
        hueCanvas.width = 0.45 * $(window).width(); // Landscape
      } else {
        hueCanvas.width = 0.45 * $(window).height(); // Portrait
        if (hueCanvas.width > 0.75 * $(window).width())
          hueCanvas.width = 0.75 * $(window).width();
      }
      hueCanvas.height = hueCanvas.width;
      hueContext.drawImage(hueImage, 0, 0, hueCanvas.width, hueCanvas.height); // ReDraw
      ctCanvas.width = hueCanvas.width;
      ctCanvas.height = ctCanvas.width / 2;
      ctContext.drawImage(ctImage, 0, 0, ctCanvas.width, ctCanvas.height); // ReDraw
    }

    $('#hueLightCanvas').on('click', function(event) {
      var x = event.offsetX;
      var y = event.offsetY;
      var HueContext = document.getElementById('hueLightCanvas').getContext('2d');
      var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
      var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
      MyHue.LightSetRGB($scope.Index, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    });

    $('#ctLightCanvas').on('click', function(event) { // 2000..6500
      var ctLightCanvas = document.getElementById('ctLightCanvas');
      var x = event.offsetX;
      var y = event.offsetY;
      var ColorTemperature = 2000 + (6500-2000)*(x/ctLightCanvas.width);
      var Brightness = 255 - 255*(y/ctLightCanvas.height);
      MyHue.LightSetColortemperature($scope.Index, ColorTemperature);
      MyHue.LightSetBrightness($scope.Index, Brightness);
    });

    $scope.Update = function(NewLightNr) {
      var LightArray = _.toArray(MyHue.Lights);
      LightArray.unshift({'name': 'Onebased index'}); // Light 0 doesn't exist
      $scope.Index = NewLightNr;
      //console.log('Light->Update '+$scope.Index);
      if ($scope.Index < LightArray.length)
        $scope.OrgName = $scope._Name = LightArray[$scope.Index].name;
      else $scope._Name = "Light" + $scope.Index;
    }

    $scope.Name = function(NewName) { // Getter/Setter function
      if (angular.isDefined(NewName)) { // Setter
        //console.log('Light.Name.SETter');
        return $scope._Name = NewName;
      } else { // Getter
        //console.log('Light.Name.geTTer');
        return $scope._Name;
      }
    }
  }]);

  angular.module('huewi').controller('SchedulesController', ['$scope', function($scope) {
  }]);
  angular.module('huewi').controller('ScenesController', ['$scope', function($scope) {
  }]);
  angular.module('huewi').controller('SensorsController', ['$scope', function($scope) {
  }]);
  angular.module('huewi').controller('RulesController', ['$scope', function($scope) {
  }]);
  angular.module('huewi').controller('BridgeController', ['$scope', function($scope) {
  }]);



