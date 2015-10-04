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
  MyHue.Username = '085efe879ee3ed83c04efc28a0da03d3';
  var HeartbeatInterval;
  var Status = '';
  var PrevStatus = '';

  if (window.isCordovaApp) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else $(document).ready(onStartup);

  function onStartup() {
    //setTimeout(onResume(), 50);
    onResume();
  }

  function onResume() {
    TimeBasedGradientUpdate();
    HeartbeatInterval = setInterval(StatusHeartbeat, 2500);
    StatusHeartbeat(); // Execute Immediate Too!
  }

  function onPause() {
    clearInterval(HeartbeatInterval);
    $('#HueStatusbar').show(350);
  }

//delete localStorage.MyHueBridgeIP; // Force PortalDiscoverLocalBridges TESTCODE.
  function ConnectToHueBridge() {
    if (!localStorage.MyHueBridgeIP) { // No Cached BridgeIP?
      Status = 'Trying to Discover Bridge via Portal';
      $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      MyHue.PortalDiscoverLocalBridges().then(function GetBridgeConfig() {
        MyHue.BridgeGetData().then(function EnsureWhitelisting() {
          if (!MyHue.BridgeUsernameWhitelisted) {
            Status = 'Please press connect button on Bridge';
            $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
            MyHue.BridgeCreateUser().then(function ReReadBridgeConfiguration() {
              Status = 'Connected';
              $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
            }, function UnableToCreateUseronBridge() {
              Status = 'Unable to Create User on Bridge';
              $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
            });
          } else {
            localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
            Status = 'Connected';
            $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
//MyHue.BridgeDeleteUser(MyHue.Username); // Force buttonpress on next Startup TESTCODE.
          }
        }, function UnableToRetreiveBridgeConfiguration() {
          Status = 'Unable to Retreive Bridge Configuration';
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        });
      }, function UnableToDiscoverLocalBridgesViaPortal() {
        Status = 'Unable to find Local Bridge via Portal';
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      });
    } else {
      MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      MyHue.BridgeGetData().then(function CheckWhitelisting() {
        if (MyHue.BridgeUsernameWhitelisted) {
          Status = 'Connected';
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        } else {
          delete localStorage.MyHueBridgeIP;
          Status = 'Not Whitelisted anymore';
          $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
        }
      }, function ErrorGettingCachedBridgeData() {
        delete localStorage.MyHueBridgeIP;
        Status = 'Not found anymore';
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as Status Update
      });
    }
  }

  function StatusHeartbeat() {
    if (Status != 'Connected') {
      ConnectToHueBridge();
    } else {
      if (PrevStatus != Status) {
        $('#HueStatusbar').slideUp(750);
      }
      MyHue.BridgeGetData().then(function UpdateUI() {
        $rootScope.$emit('huewiUpdate'); // huewiUpdate as in new data from Bridge.
      }, function BridgeGetDataFailed() {
        setTimeout(function() {
          Status = 'Disconnected';
          onPause();
          onResume();
        }, 1000);
      });
    }
    PrevStatus = Status;
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


angular.module('huewi').controller('MenuController', function($rootScope, $scope) {
  $scope.MenuItem = 'Connecting';
  
  $scope.SetMenuItem = function(NewItem, NewIndex) {

    $scope.MenuItem = NewItem;
    if ($scope.MenuItem === '') // No Overlay selected
      $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
    else
      $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>
    $scope.$broadcast('MenuUpdate', NewIndex);
  };
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
  $scope.Groups = [{'name': 'All available lights', HTMLColor: "#ffcc88"}, {'name': 'Group1'}, {'name': 'Group2'}, {'name': 'Group3'}];

  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.Groups = _.toArray(hueConnector.MyHue().Groups);
    $scope.Groups.unshift({'name': 'All available lights'});
    _.each($scope.Groups, function(Group) {
      Group.HTMLColor = StateToHTMLColor(Group.action);
    });
    $scope.$apply();
  });
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

  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.Lights = _.toArray(hueConnector.MyHue().Lights);
    _.each($scope.Lights, function(Light) {
      Light.HTMLColor = StateToHTMLColor(Light.state, Light.modelid);
    });
    $scope.$apply();
  });
});


})();



(function () {

  
angular.module('huewi').controller('GroupController', function($rootScope, $scope, hueConnector) {
  var hueImage = new Image();
  hueImage.src = 'img/hue.png';
  var ctImage = new Image();
  ctImage.src = 'img/ct.png';
  var GroupArray = _.toArray(hueConnector.MyHue().Groups);
  $scope.Index = 0;
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
  };

  $('#hueGroupCanvas').on('click', function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var HueContext = document.getElementById('hueGroupCanvas').getContext('2d');
    var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
    var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
    hueConnector.MyHue().GroupSetRGB($scope.Index, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
  });

  $('#ctGroupCanvas').on('click', function(event) { // 2000..6500
    var ctGroupCanvas = document.getElementById('ctGroupCanvas');
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctGroupCanvas.width);
    var Brightness = 255 - 255*(y/ctGroupCanvas.height);
    hueConnector.MyHue().GroupSetColortemperature($scope.Index, ColorTemperature);
    hueConnector.MyHue().GroupSetBrightness($scope.Index, Brightness);
  });

  $rootScope.$on('huewiUpdate', function(event, data) {
    GroupArray = _.toArray(hueConnector.MyHue().Groups);
    GroupArray.unshift({'name': 'All available lights'}); // Group 0 is All
    $scope.$apply();
  });

  $scope.$on('MenuUpdate', function(event, data) {
    $scope.Index = data;
    if ($scope.Index < GroupArray.length)
      $scope.OrgName = $scope._Name = GroupArray[$scope.Index].name;
    else $scope.OrgName = $scope._Name = "Group" + $scope.Index;
  });

  $scope.Name = function(NewName) { // Getter/Setter function
    if (angular.isDefined(NewName))
    {
      $scope._Name = NewName;
      hueConnector.MyHue().GroupSetName($scope.Index ,$scope._Name);
    }
    return $scope._Name;
  };
});


})();



(function () {

  
angular.module('huewi').controller('LightController', function($rootScope, $scope, hueConnector) {
  var hueImage = new Image();
  hueImage.src = 'img/hue.png';
  var ctImage = new Image();
  ctImage.src = 'img/ct.png';
  var LightArray = _.toArray(hueConnector.MyHue().Lights);
  $scope.Index = 1;
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
  };

  $('#hueLightCanvas').on('click', function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var HueContext = document.getElementById('hueLightCanvas').getContext('2d');
    var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
    var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
    hueConnector.MyHue().LightSetRGB($scope.Index, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
  });

  $('#ctLightCanvas').on('click', function(event) { // 2000..6500
    var ctLightCanvas = document.getElementById('ctLightCanvas');
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctLightCanvas.width);
    var Brightness = 255 - 255*(y/ctLightCanvas.height);
    hueConnector.MyHue().LightSetColortemperature($scope.Index, ColorTemperature);
    hueConnector.MyHue().LightSetBrightness($scope.Index, Brightness);
  });

  $rootScope.$on('huewiUpdate', function(event, data) {
    LightArray = _.toArray(hueConnector.MyHue().Lights);
    LightArray.unshift({'name': 'Onebased index'}); // Light 0 doesn't exist
    $scope.$apply();
  });

  $scope.$on('MenuUpdate', function(event, data) {
    $scope.Index = data;
    if ($scope.Index < LightArray.length)
      $scope.OrgName = $scope._Name = LightArray[$scope.Index].name;
    else $scope.OrgName = $scope._Name = "Light" + $scope.Index;
  });

  $scope.Name = function(NewName) { // Getter/Setter function
    if (angular.isDefined(NewName))
    {
      $scope._Name = NewName;
      hueConnector.MyHue().LightSetName($scope.Index ,$scope._Name);
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

  
angular.module('huewi').controller('BridgeController', function($rootScope, $scope, hueConnector) {
  $rootScope.$on('huewiUpdate', function(event, data) {
    $scope.$apply();
  });
});


})();
