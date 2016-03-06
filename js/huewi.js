var app = angular.module('huewi', ['ngAnimate']);

function StateToHTMLColor(State, Model)
{
  function ToHexString(In) {
    var Result = Math.floor(In).toString(16);
    return Result.length == 1 ? "0" + Result : Result;
  }

  if (State) { // Group 0 (All available lights) doesn't have properties
    Model = Model || "LCT001";
    var RGB;
    var xy;

    if (State.colormode === 'hs') {
      RGB = huepi.HelperHueAngSatBritoRGB(State.hue * 360 / 65535, State.sat / 255, State.bri / 255);
      xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
      RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, State.bri / 255, Model);
    } else if (State.colormode === 'xy') {
      RGB = huepi.HelperXYtoRGBforModel(State.xy[0], State.xy[1], State.bri / 255, Model);
    } else if (State.colormode === 'ct') {
      RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / State.ct));
      xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
      RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, State.bri / 255, Model);
    }
    return "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
  } else return "#ffcc88"; 
}



(function () {


angular.module('huewi').factory('hueConnector', function ($rootScope) {
  var MyHue = new huepi();
  // No Longer possible to create custom values -> MyHue.Username = '085efe879ee3ed83c04efc28a0da03d3';
  var HeartbeatInterval;
  var Status = '';
  
  if (window.isCordovaApp) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else $(document).ready(onStartup);

  function onStartup() {
    onResume();
  }

  function onResume() {
    TimeBasedGradientUpdate();
    ConnectToHueBridge();
    HeartbeatInterval = setInterval(StatusHeartbeat, 2500);
    //StatusHeartbeat(); // Execute Immediate Too!
  }

  function onPause() {
    clearInterval(HeartbeatInterval);
    $('#HueStatusbar').show(350);
  }

  function StatusHeartbeat() {
    MyHue.BridgeGetData().then(function UpdateUI() {
      $rootScope.$emit('huewiUpdate'); // huewiUpdate as in new data from Bridge.
      $('#HueStatusbar').slideUp(750);
    }, function BridgeGetDataFailed() {
      Status = 'Disconnected';
      setTimeout(function() {
        onPause();
        onResume();
      }, 100);
    });
  }

//delete localStorage.MyHueBridgeIP; // Force PortalDiscoverLocalBridges TESTCODE.
  function ConnectToHueBridge() {
    if (!localStorage.MyHueBridgeIP) { // No Cached BridgeIP?
      Status = 'Trying to Discover Bridge via Portal';
      $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      MyHue.PortalDiscoverLocalBridges().then(function BridgesDiscovered() {
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        MyHue.BridgeGetConfig().then(function BridgeConfigReceived() {
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
//MyHue.BridgeIP = "127.0.0.1:8000"; // Test On SteveyO/Hue-Emulator  TESTCODE.
          MyHue.BridgeGetData().then(function BridgeDataReceived() {
            localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
            Status = 'Connected';
            $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
//MyHue.BridgeDeleteUser(MyHue.Username); // Force buttonpress on next Startup TESTCODE.
          }, function UnableToRetreiveBridgeData() {
            Status = 'Please press connect button on the hue Bridge';
            $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
            MyHue.BridgeCreateUser('huewi').then(function BridegeUserCreated() {
              localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
              Status = 'Connected';
              $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
            }, function UnableToCreateUseronBridge() {
              Status = '.Please press connect button on the hue Bridge.';
              $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
            });  
          });
        }, function UnableToRetreiveBridgeConfiguration() {
          Status = 'Unable to Retreive Bridge Configuration';
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        });
      }, function UnableToDiscoverLocalBridgesViaPortal() {
        Status = 'Unable to find Local Bridge via Portal';
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      });
    } else {
      Status = 'Using Cached Bridge IP';
      $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      MyHue.PortalDiscoverLocalBridges(); // Parallel search for LocalBridges
      MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      MyHue.BridgeGetConfig().then(function CachedBridgeConfigReceived() {
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        MyHue.BridgeGetData().then(function CachedBridgeDataReceived() {
          Status = 'Connected';
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        }, function UnableToRetreiveCachedBridgeData() {
          delete localStorage.MyHueBridgeIP;
          Status = 'Unable to Retreive Cached Bridge Data';
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        });
      }, function UnableToRetreiveCachedBridgeConfig() {
        delete localStorage.MyHueBridgeIP;
        Status = 'Unable to Retreive Cached Bridge Configuration';
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      });
    }
  }

return {
    MyHue: function () {
      return MyHue;
    },
    Status: function() {
      return Status;
    }
  };
});


})();



(function () {

  
angular.module('huewi').controller('HueStatusController', function($rootScope, $scope, hueConnector) {
  $scope.MyHue = hueConnector.MyHue(); // For conveinient usage of MyHue in HTML within this controllers $scope
window.MyHue = hueConnector.MyHue(); // For Debugging TESTCODE
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.Status = hueConnector.Status();
    $scope.$apply();
  });

});


})();



(function () {


angular.module('huewi').controller('MenuController', function($rootScope, $scope, hueConnector) {
  $scope.MenuItem = 'Connecting';
  
  $scope.SetMenuItem = function(NewItem, NewIndex) {
    $scope.MenuItem = NewItem;
    if ($scope.MenuItem === '') // No Overlay selected
      $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
    else $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>
    $scope.$broadcast('MenuUpdate', NewItem, NewIndex);
  };

  document.addEventListener('backbutton', function(event) { // Cordova/PhoneGap only.
    if (angular.element("#Menu").scope().MenuItem !== '') {
      angular.element("#Menu").scope().MenuItem = '';
      angular.element("#Menu").scope().$broadcast('MenuUpdate', '', 27);
      event.preventDefault();
    }
  });

  document.onkeyup = function(event) {
    if (angular.element("#Menu").scope().MenuItem !== '') {
      // Escape & Enter will close open Overlays.
      if ((event.keyCode === 27) || (event.keyCode === 13)) {
        angular.element("#Menu").scope().MenuItem = '';
        angular.element("#Menu").scope().$broadcast('MenuUpdate', '', event.keyCode);
        event.preventDefault();
      }
      if (event.keyCode === 27)
        $('body').trigger('click'); // Close navdrawer
    }
  }

});


})();



(function () {

  
angular.module('huewi').controller('TabController', function($scope) {
  $scope.Tab = 1;

  $scope.TabIsSet = function(CheckTab) {
    return $scope.Tab === CheckTab;
  };
  $scope.SetTab = function(SetTab) {
    $scope.Tab = SetTab;
  };
  $scope.GetTab = function() {
    return $scope.Tab;
  };
});


})();



(function () {

  
angular.module('huewi').directive("huewiGroups", function() {
  return {
    restrict: 'E',
    templateUrl: "huewi-groups.html"
  };
});

angular.module('huewi').controller('GroupsController', function($rootScope, $scope, hueConnector) {
  $scope.Groups = [{'name': 'All available lights', type: "LightGroup", HTMLColor: "#ffcc88"}, {'name': 'Group1'}, {'name': 'Group2'}, {'name': 'Group3'}];
  $scope.Active = -1;
  $scope.Cache = [];
  $scope.UpdateScheduled = false;
  
  $rootScope.$on('huewiUpdate', function(event, data) {
    if (hueConnector.MyHue().GroupIds.length >0) {
      if ($scope.Active >= 0) // Cache Active
        $scope.Cache = $scope.Groups[$scope.Active];
      $scope.Groups = [];
      $scope.Groups[0] = {'name': 'All available lights', type: "LightGroup", HTMLColor: "#ffcc88"};
      var GroupNr = 1;
      for (var Key in hueConnector.MyHue().Groups) {
        if (GroupNr !== $scope.Active)
          $scope.Groups[GroupNr] = hueConnector.MyHue().Groups[Key];
        else
          $scope.Groups[GroupNr] = $scope.Cache; // Use Cached Active
        $scope.Groups[GroupNr].HTMLColor = StateToHTMLColor($scope.Groups[GroupNr].action);
        GroupNr ++;
      }
      $scope.$apply();
    }
  });

  $scope.SetActive = function(GroupNr) {
    $scope.Active = GroupNr;
  };

  $scope.SetBrightness = function(GroupNr) {
    if ($scope.UpdateScheduled === false)
    { 
      $scope.UpdateScheduled = true;
      setTimeout(function(){
        hueConnector.MyHue().GroupSetBrightness(GroupNr, $scope.Groups[GroupNr].action.bri);
        $scope.UpdateScheduled = false;
      }, 200);
    }
  };

});


})();



(function () {

  
angular.module('huewi').directive("huewiLights", function() {
  return {
    restrict: 'E',
    templateUrl: "huewi-lights.html"
  };
});

angular.module('huewi').controller('LightsController', function($rootScope, $scope, hueConnector) {
  $scope.Lights = [{'name': 'Light1'}, {'name': 'Light2'}, {'name': 'Light3'}];
  $scope.Active = -1;
  $scope.Cache = [];
  $scope.UpdateScheduled = false;

  $rootScope.$on('huewiUpdate', function(event, data) {
    if (hueConnector.MyHue().LightIds.length >0) {
      if ($scope.Active >= 0) // Cache Active
        $scope.Cache = $scope.Lights[$scope.Active];
      $scope.Lights = [];
      var LightNr = 0;
      for (var Key in hueConnector.MyHue().Lights) {
        if (LightNr !== $scope.Active)
          $scope.Lights[LightNr] = hueConnector.MyHue().Lights[Key];
        else
          $scope.Lights[LightNr] = $scope.Cache; // Use Cached Active
        $scope.Lights[LightNr].HTMLColor = StateToHTMLColor($scope.Lights[LightNr].state);
        LightNr ++;
      }      
      $scope.$apply();
    }
  });

  $scope.SetActive = function(LightNr) {
    $scope.Active = LightNr;
  };

  $scope.SetBrightness = function(LightNr) {
    if ($scope.UpdateScheduled === false)
    { 
      $scope.UpdateScheduled = true;
      setTimeout(function(){
        hueConnector.MyHue().LightSetBrightness(LightNr + 1, $scope.Lights[LightNr].state.bri);
        $scope.UpdateScheduled = false;
      }, 200);
    }
  };

});


})();



(function () {

  
angular.module('huewi').controller('GroupAndLightController', function($rootScope, $scope, hueConnector) {
  var hueImage = new Image();
  hueImage.src = 'img/hue.png';
  var ctImage = new Image();
  ctImage.src = 'img/ct.png';
  $scope.Index = 0;
  $scope._Name = '';
  $scope.OrgName = $scope._Name;

  hueImage.onload = function() {
    $scope.Redraw();
  };

  ctImage.onload = function() {
    $scope.Redraw();
  };

  $(window).resize(function(){
    $scope.Redraw();
  });

  $scope.Redraw = function() {
    var hueCanvas = document.getElementById('hueCanvas');
    var hueContext = hueCanvas.getContext('2d');
    var ctCanvas = document.getElementById('ctCanvas');
    var ctContext = ctCanvas.getContext('2d');
    // Canvas size should be set by script not css, otherwise getting HueImagePixel doesn't match canvas sizes
    hueCanvas.width = 0.35 * $(window).width();
    if (hueCanvas.width > 0.75 * $(window).height())
      hueCanvas.width = 0.75 * $(window).height();
    hueCanvas.height = hueCanvas.width;
    hueContext.drawImage(hueImage, 0, 0, hueCanvas.width, hueCanvas.height); // ReDraw
    ctCanvas.width = hueCanvas.width;
    ctCanvas.height = ctCanvas.width / 2;
    ctContext.drawImage(ctImage, 0, 0, ctCanvas.width, ctCanvas.height); // ReDraw
  };

  $('#hueCanvas').on('click', function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var HueContext = document.getElementById('hueCanvas').getContext('2d');
    var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
    var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
    if ($scope.Item === 'Group') {
      hueConnector.MyHue().GroupSetRGB($scope.Index, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    } else if ($scope.Item === 'Light') {
      hueConnector.MyHue().LightSetRGB($scope.Index, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    }
  });

  $('#ctCanvas').on('click', function(event) { // 2000..6500
    var ctGroupCanvas = document.getElementById('ctCanvas');
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctGroupCanvas.width);
    var Brightness = 255 - 255*(y/ctGroupCanvas.height);
    if ($scope.Item === 'Group') {
      hueConnector.MyHue().GroupSetColortemperature($scope.Index, ColorTemperature);
      hueConnector.MyHue().GroupSetBrightness($scope.Index, Brightness);
    } else if ($scope.Item === 'Light') {
      hueConnector.MyHue().LightSetColortemperature($scope.Index, ColorTemperature);
      hueConnector.MyHue().LightSetBrightness($scope.Index, Brightness);
    }
  });

  $scope.$on('MenuUpdate', function(event, NewItem, NewIndex) {
    // Is Ecape Hit? Reset Name to OrgName
    if ((NewItem === '') && (NewIndex === 27)) {
      if ($scope.Name() != $scope.OrgName)
        $scope.Name($scope.OrgName);
    } else {
      $scope.Item = NewItem;
      $scope.Index = NewIndex;
      // AlertSelect -> Flash Once.
      if ($scope.Item === 'Group')
        hueConnector.MyHue().GroupAlertSelect($scope.Index);
      if ($scope.Item === 'Light')
        hueConnector.MyHue().LightAlertSelect($scope.Index);

      if ($scope.Item === 'Group') {
        if ($scope.Index === 0)
          $scope.OrgName = $scope._Name = 'All Available Lights';
        else if ($scope.Index <= hueConnector.MyHue().GroupIds.length)
          $scope.OrgName = $scope._Name = hueConnector.MyHue().Groups[hueConnector.MyHue().GroupGetId($scope.Index)].name;
        //else $scope.OrgName = $scope._Name = "Group" + $scope.Index;
      } else if ($scope.Item === 'Light') {
        if ($scope.Index <= hueConnector.MyHue().LightIds.length)
          $scope.OrgName = $scope._Name = hueConnector.MyHue().Lights[hueConnector.MyHue().LightGetId($scope.Index)].name;
        //else $scope.OrgName = $scope._Name = "Light " + $scope.Index;
      }
    }
    $scope.$apply();
  });

  $scope.Relax = function(NewName) {
    if ($scope.Item === 'Group') {
      MyHue.GroupSetCT($scope.Index, 467);
      MyHue.GroupSetBrightness($scope.Index, 144);
    } else if ($scope.Item === 'Light') {
      MyHue.LightSetCT($scope.Index, 467);
      MyHue.LightSetBrightness($scope.Index, 144);
    }
  }
  
  $scope.Reading = function(NewName) {
    if ($scope.Item === 'Group') {
      MyHue.GroupSetCT($scope.Index, 343);
      MyHue.GroupSetBrightness($scope.Index, 240);
    } else if ($scope.Item === 'Light') {
      MyHue.LightSetCT($scope.Index, 343);
      MyHue.LightSetBrightness($scope.Index, 240);
    }
  }
  
  $scope.Concentrate = function(NewName) {
    if ($scope.Item === 'Group') {
      MyHue.GroupSetCT($scope.Index, 231);
      MyHue.GroupSetBrightness($scope.Index, 219);
    } else if ($scope.Item === 'Light') {
      MyHue.LightSetCT($scope.Index, 231);
      MyHue.LightSetBrightness($scope.Index, 219); 
    }
  }
  
  $scope.Energize = function(NewName) {
    if ($scope.Item === 'Group') {
      MyHue.GroupSetCT($scope.Index, 156);
      MyHue.GroupSetBrightness($scope.Index, 203);
    } else if ($scope.Item === 'Light') {
      MyHue.LightSetCT($scope.Index, 156);
      MyHue.LightSetBrightness($scope.Index, 203);
    }
  }
  
  $scope.GoldenHour = function(NewName) {
    if ($scope.Item === 'Group') {
      MyHue.GroupSetColortemperature($scope.Index, 2500);
      MyHue.GroupSetBrightness($scope.Index, 125);
    } else if ($scope.Item === 'Light') {
      MyHue.LightSetColortemperature($scope.Index, 2500);
      MyHue.LightSetBrightness($scope.Index, 125);
    }
  }
  
  $scope.Name = function(NewName) { // Getter/Setter function
    if (angular.isDefined(NewName))
    { // Set
      $scope._Name = NewName;
      if ($scope.Item === 'Group') {
        hueConnector.MyHue().GroupSetName($scope.Index ,$scope._Name);
      } else if ($scope.Item === 'Light') {
        hueConnector.MyHue().LightSetName($scope.Index ,$scope._Name);
      }
    }
    return $scope._Name;
  };

});


})();



(function () {

  
angular.module('huewi').controller('SchedulesController', function($rootScope, $scope, hueConnector) {
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.$apply();
  });
});


})();



(function () {

  
angular.module('huewi').controller('ScenesController', function($rootScope, $scope, hueConnector) {
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.$apply();
  });
});


})();



(function () {

  
angular.module('huewi').controller('SensorsController', function($rootScope, $scope, hueConnector) {
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.$apply();
  });
});


})();



(function () {

  
angular.module('huewi').controller('RulesController', function($rootScope, $scope, hueConnector) {
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.$apply();
  });
});


})();



(function () {


angular.module('huewi').filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    for (var key in items) {
      var item = items[key];
      item['key'] = key;
      filtered.push(item);
    };
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});


angular.module('huewi').controller('BridgeController', function($rootScope, $scope, hueConnector) {
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.$apply();
  });  
});


})();
