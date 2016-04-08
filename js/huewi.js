var app = angular.module('huewi', ['ngAnimate']);



(function () {


angular.module(app.name).filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    for (var key in items) {
      var item = items[key];
      item['id'] = key;
      filtered.push(item);
    };
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});


})();



(function () {


angular.module(app.name).controller('TabController', function($scope) {
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


angular.module(app.name).factory('hueConnector', function ($rootScope) {
  var MyHue = new huepi();
  //var MyHue = new huepi("localhost:8000"); // Emulator
  var HeartbeatInterval;
  var Status = '';
  // Demo Data while loading.
  MyHue.Groups = [{name: 'All available lights', type: 'LightGroup', HTMLColor: '#ffcc88', id:'0'}, {name: 'Group1'}, {name: 'Group2'}, {name: 'Group3'}];
  MyHue.Lights = [{name: 'Light1'}, {name: 'Light2'}, {name: 'Light3'}];
  
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
    //if (Status !== "Connected")
      //setTimeout(function() { onResume() }, 2500);
  }

  function onPause() {
    clearInterval(HeartbeatInterval);
  }

  function StateToHTMLColor(State, Model) {
    function ToHexString(In) {
      var Result = Math.floor(In).toString(16);
      return Result.length == 1 ? "0" + Result : Result;
    }

    if (State && State.colormode) { // Group 0 (All available lights) doesn't have all properties
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

  function ReConnectHueBridge() { // IP is stored in MyHue.BridgeIP
    Status = 'Getting Config';
    setTimeout(function() { $rootScope.$apply(); }, 1);
    MyHue.BridgeGetConfig().then(function() {
      Status = 'Bridge Config Received, Getting Data';
      setTimeout(function() { $rootScope.$apply(); }, 1);
      MyHue.BridgeGetData().then(function() {
        localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
        BridgeDataReceived();
        Status = 'Connected';
        setTimeout(function() { $rootScope.$apply(); }, 1);
        HeartbeatInterval = setInterval(StatusHeartbeat, 2500);
      }, function() {
        Status = 'Please press connect button on the hue Bridge';
        setTimeout(function() { $rootScope.$apply(); }, 1);
        MyHue.BridgeCreateUser(app.name).then(function() {
          localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
          Status = 'Connected';
          setTimeout(function() { $rootScope.$apply(); }, 1);
          HeartbeatInterval = setInterval(StatusHeartbeat, 2500);
        }, function() {
          Status = 'Please press connect button on the hue Bridge';
          setTimeout(function() { $rootScope.$apply(); }, 1);
        });
      });
    }, function() {
      Status = 'Unable to Retreive Bridge Configuration';
      delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
      setTimeout(function() { $rootScope.$apply(); }, 1);
    });
  }

  function ConnectToHueBridge() {
    clearInterval(HeartbeatInterval);
    if (MyHue.BridgeIP !== "") { // Preset/Previous BridgeIP
      ReConnectHueBridge();
    } else if (localStorage.MyHueBridgeIP) { // Cached BridgeIP
      MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      ReConnectHueBridge();
    } else {
      Status = 'Trying to Discover Bridge via Portal';
      setTimeout(function() { $rootScope.$apply(); }, 1);
      MyHue.PortalDiscoverLocalBridges().then(function() {
        Status = 'Bridge Discovered, Getting Config';
        setTimeout(function() { $rootScope.$apply(); }, 1);
        ReConnectHueBridge();
      }, function() { // else
        Status = 'Unable to find Local Bridge via Portal';
        setTimeout(function() { $rootScope.$apply(); }, 1);
      } );
    }
  }

  function ScanForHueBridges() {
    clearInterval(HeartbeatInterval);
    Status = 'Trying to Discover Bridge on Network';
    setTimeout(function() { $rootScope.$apply(); }, 1);
    MyHue.NetworkDiscoverLocalBridges().then(function() {
      Status = 'Bridge Discovered, Getting Config';
      setTimeout(function() { $rootScope.$apply(); }, 1);
      ReConnectHueBridge();
    }, function() { // else
      Status = 'Unable to find Local Bridge on Network';
      setTimeout(function() { $rootScope.$apply(); }, 1);
    }).progress(function update(Percentage){
      Status = 'Searching Local Network for Bridge '+ Percentage +'% done';
      setTimeout(function() { $rootScope.$apply(); }, 1);
    });
  }

  function BridgeDataReceived() {
    MyHue.Groups['0'] = {name: 'All available lights', type: 'LightGroup', HTMLColor: '#ffcc88'};
    for (var Key in MyHue.Groups) {
      MyHue.Groups[Key].id = Key;
      MyHue.Groups[Key].HTMLColor = StateToHTMLColor(MyHue.Groups[Key].action);
    }
    for (var Key in MyHue.Lights) {
      MyHue.Lights[Key].id = Key;
      MyHue.Lights[Key].HTMLColor = StateToHTMLColor(MyHue.Lights[Key].state);
    }
  }

  $rootScope.$watch(function() {
    return Status;
    }, function WatchStatus(NewStatus, OldStatus) {
      setTimeout(function() { $rootScope.$apply(); }, 1);
      if (NewStatus!=='Connected')
        $('#HueStatusbar').show(350);
      else setTimeout(function() { $('#HueStatusbar').slideUp(750) }, 1);
    }
  );
  
  function StatusHeartbeat() {
    MyHue.BridgeGetData().then(function UpdateUI() {
      BridgeDataReceived();
      setTimeout(function() { $rootScope.$apply(); }, 1);
    }, function BridgeGetDataFailed() {
      Status = 'Disconnected';
      setTimeout(function() {
        onPause();
        onResume();
      }, 1);
    });
  }

return {
    MyHue : function () {
      return MyHue;
    },
    Status : function() {
      return Status;
    },
    ConnectToHueBridge : function() {
      return ConnectToHueBridge();
    },
    ScanForHueBridges : function() {
      return ScanForHueBridges();
    }
  };
});


})();



(function () {


angular.module(app.name).factory('Menu', function($rootScope) {
  var Item = 'Connecting';
  var Index = ' ';
  
  return {
    SetItem : function(NewItem, NewIndex) {
      Item = NewItem;
      Index = NewIndex;
      if (Item === '') // No Overlay selected
        $('body').css('overflow', 'initial'); // Enable scrolling of the <Body>
      else $('body').css('overflow', 'hidden'); // Disable scrolling of the <Body>
      $rootScope.$broadcast('MenuUpdate', NewItem, NewIndex);
      setTimeout(function() { $rootScope.$apply() }, 1);
    },
    GetItem : function() {
      return Item;
    },
    GetIndex : function() {
      return Index;
    }
  };

});


})();



(function () {


angular.module(app.name).controller('HueController', function($rootScope, $scope, hueConnector, Menu) {
  $scope.MyHue = hueConnector.MyHue(); // For conveinient usage of MyHue in HTML within this controllers $scope
  window.hue = hueConnector.MyHue(); // For Debugging TESTCODE
  $scope.UpdateScheduled = false;

  $scope.Status = function() {
    return hueConnector.Status();
  }

  $scope.Connect = function() {
    return hueConnector.ConnectToHueBridge();
  }

  $scope.Scan = function() {
    return hueConnector.ScanForHueBridges();
  }

  $scope.SetGroupBrightness = function(GroupId) {
    if ($scope.UpdateScheduled === false)
    { 
      $scope.UpdateScheduled = true;
      setTimeout(function(){
        hueConnector.MyHue().GroupSetBrightness(GroupId, hueConnector.MyHue().Groups[GroupId].action.bri, 2);
        $scope.UpdateScheduled = false;
      }, 200);
    }
  };

  $scope.SetLightBrightness = function(LightId) {
    if ($scope.UpdateScheduled === false)
    { 
      $scope.UpdateScheduled = true;
      setTimeout(function(){
        hueConnector.MyHue().LightSetBrightness(LightId , hueConnector.MyHue().Lights[LightId].state.bri, 2);
        $scope.UpdateScheduled = false;
      }, 200);
    }
  };

  $scope.SetMenuItem = function(NewItem, NewIndex) {
    return Menu.SetItem(NewItem, NewIndex);
  }

  $scope.MenuItem = function() {
    return Menu.GetItem();
  }

  $scope.MenuIndex = function() {
    return Menu.GetIndex();
  }

  document.addEventListener('backbutton', function(event) { // Cordova/PhoneGap only.
    if (angular.element("#HueStatus").scope().MenuItem() !== '') {
      angular.element("#HueStatus").scope().MenuItem() = '';
      angular.element("#HueStatus").scope().SetMenuItem('', 27);
    }
  });

  document.onkeyup = function(event) {
    if (angular.element("#HueStatus").scope().MenuItem() !== '') {
      // Escape & Enter will close open Overlays.
      if ((event.keyCode === 27) || (event.keyCode === 13)) {
        angular.element("#HueStatus").scope().SetMenuItem('', event.keyCode);
      }
    }
  }
});


})();



(function () {

  
angular.module(app.name).directive("huewiGroups", function() {
  return {
    restrict: 'E',
    templateUrl: "huewi-groups.html"
  };
});

angular.module(app.name).controller('GroupsController', function($rootScope, $scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).directive("huewiLights", function() {
  return {
    restrict: 'E',
    templateUrl: "huewi-lights.html"
  };
});

angular.module(app.name).controller('LightsController', function($rootScope, $scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller('GroupAndLightController', function($rootScope, $scope, hueConnector) {
  $scope.Item = '';
  $scope.Index = '';
  var hueImage = new Image();
  hueImage.src = 'img/hue.png';
  var ctImage = new Image();
  ctImage.src = 'img/ct.png';
  $scope._Name = 'Light/Group';
  $scope.OrgName = $scope._Name;

  $scope.$on('MenuUpdate', function(event, NewItem, NewIndex) {
    if (NewItem === '') { // Key is Hit.
      if (NewIndex === 27) { // Is Ecape Hit? Reset Name to OrgName
        if ($scope.Name() != $scope.OrgName)
          $scope.Name($scope.OrgName);
      }
    } else {
      $scope.Item = NewItem;
      $scope.Index = NewIndex;

      if ($scope.Item === 'Group') {
        hueConnector.MyHue().GroupAlertSelect($scope.Index);
        $scope.OrgName = $scope._Name = hueConnector.MyHue().Groups[$scope.Index].name;
      } else if ($scope.Item === 'Light') {
        hueConnector.MyHue().LightAlertSelect($scope.Index);       
        $scope.OrgName = $scope._Name = hueConnector.MyHue().Lights[hueConnector.MyHue().LightGetId($scope.Index)].name;
      }
    }
  });

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
    if ($(window).width() > $(window).height()) {
      hueCanvas.width = 0.38 * $(window).width();
      if (hueCanvas.width > 0.75 * $(window).height())
        hueCanvas.width = 0.75 * $(window).height();
    } else {
      hueCanvas.width = 0.57 * $(window).width();
      if (hueCanvas.width > 0.95 * $(window).height())
        hueCanvas.width = 0.95 * $(window).height
    }
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

  $scope.GroupHasLight = function(LightId) {
    if ($scope.Item === 'Group') {
      if ($scope.Index === '0') return false;
      if (hueConnector.MyHue().Groups[$scope.Index].lights.indexOf(LightId)>=0)
        return true;
    }
    return false;
  }
  
  $scope.GroupToggleLight = function(LightId) {
    if ($scope.Item === 'Group') {
      hueConnector.MyHue().LightAlertSelect(LightId);
      if ($scope.GroupHasLight(LightId))
        hueConnector.MyHue().Groups[$scope.Index].lights.splice(
          hueConnector.MyHue().Groups[$scope.Index].lights.indexOf(LightId),1);
      else hueConnector.MyHue().Groups[$scope.Index].lights.push(LightId);
      hueConnector.MyHue().GroupSetLights($scope.Index, hueConnector.MyHue().Groups[$scope.Index].lights);
    }
  }

  $scope.Name = function(NewName) { // Getter/Setter function
    if (angular.isDefined(NewName))
    { // Set
      if ($scope.Item === 'Group') {
        hueConnector.MyHue().GroupSetName($scope.Index, NewName);
      } else if ($scope.Item === 'Light') {
        hueConnector.MyHue().LightSetName($scope.Index, NewName);
      }
      $scope._Name = NewName;
    }
    return $scope._Name;
  };

  $scope.SetCTBrightness = function(CT, Brightness) {
    if ($scope.Item === 'Group') {
      hueConnector.MyHue().GroupSetCT($scope.Index, CT);
      hueConnector.MyHue().GroupSetBrightness($scope.Index, Brightness);
    } else if ($scope.Item === 'Light') {
      hueConnector.MyHue().LightSetCT($scope.Index, CT);
      hueConnector.MyHue().LightSetBrightness($scope.Index, Brightness);
    }    
  } 
  $scope.Relax = function(NewName) {
    $scope.SetCTBrightness(467, 144);
  }
  
  $scope.Reading = function(NewName) {
    $scope.SetCTBrightness(343, 240);
  }
  
  $scope.Concentrate = function(NewName) {
    $scope.SetCTBrightness(231, 219);
  }
  
  $scope.Energize = function(NewName) {
    $scope.SetCTBrightness(156, 203);
  }
  
  $scope.GoldenHour = function(NewName) {
    $scope.SetCTBrightness(400, 125);
  }

});


})();



(function () {


angular.module(app.name).controller('SchedulesController', function($rootScope, $scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller('ScenesController', function($rootScope, $scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller('SensorsController', function($rootScope, $scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller('RulesController', function($rootScope, $scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller('BridgeController', function($rootScope, $scope, hueConnector) {
});


})();
