var app = angular.module('huewi', ['ngAnimate']);

function ToHexString(In) {
  var Result = Math.floor(In).toString(16);
  return Result.length == 1 ? "0" + Result : Result;
}

function StateToHTMLColor(State)
{
   if (State) { // Group 0 (All available lights) doesn't have properties
    var RGB;
    if (State.colormode === 'hs') {
      RGB = huepi.HelperHueAngSatBritoRGB(State.hue * 360 / 65535, State.sat / 255, State.bri / 255);
      var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
      RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, "LCT001", State.bri / 255);
    } else if (State.colormode === 'xy') {
      RGB = huepi.HelperXYtoRGBforModel(State.xy[0], State.xy[1], "LCT001", State.bri / 255);
    } else if (State.colormode === 'ct') {
      RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / State.ct));
      var xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
      RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, "LCT001", State.bri / 255);
    }
    return "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
  } else return "#ffcc88"; 
}


app.factory('hueConnector', function () {
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
      MyHue.PortalDiscoverLocalBridges().then(function GetBridgeConfig() {
        MyHue.BridgeGetData().then(function EnsureWhitelisting() {
          if (!MyHue.BridgeUsernameWhitelisted) {
            Status = 'Please press connect button on Bridge';
            MyHue.BridgeCreateUser().then(function ReReadBridgeConfiguration() {
              Status = 'Connected';
            }, function UnableToCreateUseronBridge() {
              Status = 'Unable to Create User on Bridge';
            });
          } else {
            localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
            Status = 'Connected';
//MyHue.BridgeDeleteUser(MyHue.Username); // Force buttonpress on next Startup TESTCODE.
          }
        }, function UnableToRetreiveBridgeConfiguration() {
          Status = 'Unable to Retreive Bridge Configuration';
        });
      }, function UnableToDiscoverLocalBridgesViaPortal() {
        Status = 'Unable to find Local Bridge via Portal';
      });
    } else {
      MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      MyHue.BridgeGetData().then(function CheckWhitelisting() {
        if (MyHue.BridgeUsernameWhitelisted) {
          Status = 'Connected';
        } else {
          delete localStorage.MyHueBridgeIP;
          Status = 'Not Whitelisted anymore';
        }
      }, function ErrorGettingCachedBridgeData() {
        delete localStorage.MyHueBridgeIP;
        Status = 'Not found anymore';
      });
    }
  }

  function StatusHeartbeat() {
    $('#HueStatus').scope().Update();     

    if (Status != 'Connected') {
      ConnectToHueBridge();
    } else {
      if (PrevStatus != Status) {
        $('#HueStatusbar').slideUp(750);
      }
      MyHue.BridgeGetData().then(function UpdateUI() {
        $('#Groups').scope().Update();
        $('#Lights').scope().Update();
        $('#Bridge').scope().Update();
      }, function BridgeGetDataFailed() {
        setTimeout(function() {
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
  }
});



app.controller('HueStatusController', ['$scope', 'hueConnector', function($scope, hueConnector) {
  $scope.MyHue = hueConnector.MyHue(); // For usage of MyHue in HTML within this $scope

  $scope.Update = function() {
    $scope.BridgeIP = $scope.MyHue.BridgeIP;
    $scope.BridgeName = $scope.MyHue.BridgeName;
    $scope.Status = hueConnector.Status();
    $scope.$apply();
  }
}]);



app.controller('MenuController', ['$scope', function($scope) {
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



app.controller('TabController', ['$scope', function($scope) {
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



app.directive("huewiGroups", function() {
  return {
    restrict: 'E',
    templateUrl: "huewi-groups.html"
  };
});

app.controller('GroupsController', ['$scope', 'hueConnector', function($scope, hueConnector) {
  $scope.Groups = [{'name': 'All available lights', HTMLColor: "#ffcc88"}, {'name': 'Group1'}, {'name': 'Group2'}, {'name': 'Group3'}];

  $scope.Update = function() {
    $scope.Groups = _.toArray(hueConnector.MyHue().Groups);
    $scope.Groups.unshift({'name': 'All available lights'});
    _.each($scope.Groups, function(Group) {
      Group.HTMLColor = StateToHTMLColor(Group.action);
    })
    $scope.$apply();
  }
}]);



app.directive("huewiLights", function() {
  return {
    restrict: 'E',
    templateUrl: "huewi-lights.html"
  };
});

app.controller('LightsController', ['$scope', 'hueConnector', function($scope, hueConnector) {
  $scope.Lights = [{'name': 'Light1'}, {'name': 'Light2'}, {'name': 'Light3'}];

  $scope.Update = function() {
    $scope.Lights = _.toArray(hueConnector.MyHue().Lights);
    _.each($scope.Lights, function(Light) {
      Light.HTMLColor = StateToHTMLColor(Light.state);
    })
    $scope.$apply();
  }
}]);



app.controller('GroupController', ['$scope', 'hueConnector', function($scope, hueConnector) {
  var hueImage = new Image();
  hueImage.src = 'img/hue.png';
  var ctImage = new Image();
  ctImage.src = 'img/ct.png';
  $scope.GroupNr = 0; // Zerobased Index, Group 0 is All
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
    hueConnector.MyHue().GroupSetRGB($scope.GroupNr, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
  });

  $('#ctGroupCanvas').on('click', function(event) { // 2000..6500
    var ctGroupCanvas = document.getElementById('ctGroupCanvas');
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctGroupCanvas.width);
    var Brightness = 255 - 255*(y/ctGroupCanvas.height);
    hueConnector.MyHue().GroupSetColortemperature($scope.GroupNr, ColorTemperature);
    hueConnector.MyHue().GroupSetBrightness($scope.GroupNr, Brightness);
  });

  $scope.Update = function(NewGroupNr) {
    var GroupArray = _.toArray(hueConnector.MyHue().Groups);
    GroupArray.unshift({'name': 'All available lights'}); // Group 0 is All
    $scope.GroupNr = NewGroupNr;
    if ($scope.GroupNr < GroupArray.length)
      $scope.OrgName = $scope._Name = GroupArray[$scope.GroupNr].name;
    else $scope.OrgName = $scope._Name = "Group" + $scope.GroupNr;
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



app.controller('LightController', ['$scope', 'hueConnector', function($scope, hueConnector) {
  var hueImage = new Image();
  hueImage.src = 'img/hue.png';
  var ctImage = new Image();
  ctImage.src = 'img/ct.png';
  $scope.LightNr = 1; // Onebased Index, Light 0 doesn't exist
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
    hueConnector.MyHue().LightSetRGB($scope.LightNr, HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
  });

  $('#ctLightCanvas').on('click', function(event) { // 2000..6500
    var ctLightCanvas = document.getElementById('ctLightCanvas');
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctLightCanvas.width);
    var Brightness = 255 - 255*(y/ctLightCanvas.height);
    hueConnector.MyHue().LightSetColortemperature($scope.LightNr, ColorTemperature);
    hueConnector.MyHue().LightSetBrightness($scope.LightNr, Brightness);
  });

  $scope.Update = function(NewLightNr) {
    var LightArray = _.toArray(hueConnector.MyHue().Lights);
    LightArray.unshift({'name': 'Onebased index'}); // Light 0 doesn't exist
    $scope.LightNr = NewLightNr;
    if ($scope.LightNr < LightArray.length)
      $scope.OrgName = $scope._Name = LightArray[$scope.LightNr].name;
    else $scope.OrgName = $scope._Name = "Light" + $scope.LightNr;
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



app.controller('SchedulesController', ['$scope', 'hueConnector', function($scope, hueConnector) {
}]);



app.controller('ScenesController', ['$scope', 'hueConnector', function($scope, hueConnector) {
}]);



app.controller('SensorsController', ['$scope', 'hueConnector', function($scope, hueConnector) {
}]);



app.controller('RulesController', ['$scope', 'hueConnector', function($scope, hueConnector) {
}]);



app.controller('BridgeController', ['$scope', 'hueConnector', function($scope, hueConnector) {
  $scope.Whitelist = [];

  $scope.Update = function() {
    $scope.Whitelist = hueConnector.MyHue().BridgeConfig.whitelist;      
  }
}]);


