var app = angular.module("huewi", ["ngAnimate"]);



(function () {


angular.module(app.name).filter("orderObjectBy", function() {
  return function(items, field, reverse) {
    var filtered = [];
    for (var key in items) {
      var item = items[key];
      item.id = key;
      filtered.push(item);
    }
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});


})();



/** unused (function () {


angular.module(app.name).controller("TabController", function($scope) {
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
**/


(function () {


angular.module(app.name).factory("Menu", function() {
  var Item = "Connecting";
  var Id = "";
  
  return {
    SetItem : function(NewItem, NewId) {
      Item = NewItem;
      if (NewId)
        Id = NewId;
    },
    GetItem : function() {
      return Item;
    },
    GetId : function() {
      return Id;
    }
  };

});


})();



(function () {


angular.module(app.name).factory("hueConnector", function ($rootScope) {
  var MyHue = new huepi();
  //var MyHue = new huepi("localhost:8000"); // Emulator
  var HeartbeatInterval;
  var Status = "";
  // Show this Demo Data while Connecting...
  MyHue.Groups = [{name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88", id:"0"}, {name: "Group1"}, {name: "Group2"}, {name: "Group3"}];
  MyHue.Lights = [{name: "Light1"}, {name: "Light2"}, {name: "Light3"}];
  
  if (window.cordova) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else $(document).ready(onStartup);

  function onStartup() {
    onResume();
  }

  function onResume() {
    TimeBasedGradientUpdate();
    MyHue.PortalDiscoverLocalBridges(); // Parallel
    Connect();
    setTimeout(function() {
      if ((Status != "Connected") && !MyHue.ScanningNetwork)
      onResume();
    }, 5000);
  }

  function onPause() {
    clearInterval(HeartbeatInterval);
  }

  function SetStatus(NewStatus) {
    Status = NewStatus;
    setTimeout(function() { $rootScope.$apply(); }, 1); // Make Sure UI is updated :)
  }

  function ReConnect() { // IP is stored in MyHue.BridgeIP
    clearInterval(HeartbeatInterval);
    MyHue.Username = "";
    SetStatus("Getting Config");
    MyHue.BridgeGetConfig().then(function() {
      SetStatus("Bridge Config Received, Getting Data");
      MyHue.BridgeGetData().then(function() {
        localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
        DataReceived();
        SetStatus("Connected");
        HeartbeatInterval = setInterval(onHeartbeat, 2500);
      }, function() {
        SetStatus("Please press connect button on the hue Bridge");
        MyHue.BridgeCreateUser(app.name).then(function() {
          localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
          SetStatus("Connected");
          HeartbeatInterval = setInterval(onHeartbeat, 2500);
        }, function() {
          SetStatus("Please press connect button on the hue Bridge");
        });
      });
    }, function() {
      SetStatus("Unable to Retreive Bridge Configuration");
      delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
    });
  }

  function Connect(NewBridgeAddress) {
    clearInterval(HeartbeatInterval);
    MyHue.Username = "";
    MyHue.BridgeIP = NewBridgeAddress || MyHue.BridgeIP;
    if (MyHue.BridgeIP !== "") { // Preset/Previous BridgeIP
      ReConnect();
    } else if (localStorage.MyHueBridgeIP) { // Cached BridgeIP
      MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      ReConnect();
    } else {
      SetStatus("Trying to Discover Bridge via Portal");
      MyHue.PortalDiscoverLocalBridges().then(function() {
        SetStatus("Bridge Discovered, Getting Config");
        ReConnect();
      }, function() { // else
        SetStatus("Unable to find Local Bridge via Portal");
      } );
    }
  }

  function Scan() {
    clearInterval(HeartbeatInterval);
    SetStatus("Trying to Discover Bridge on Network");
    MyHue.NetworkDiscoverLocalBridges().then(function() {
      SetStatus("Bridge Discovered, Getting Config");
      ReConnect();
    }, function() { // else
      SetStatus("Unable to find Local Bridge on Network");
    }).progress(function update(Percentage){
      SetStatus("Searching Local Network for Bridge "+ Percentage +"% done");
    });
  }

  function onHeartbeat() {
    MyHue.BridgeGetData().then(function UpdateUI() {
      DataReceived();
      setTimeout(function() { $rootScope.$apply(); }, 1);
    }, function BridgeGetDataFailed() {
      SetStatus("Disconnected");
      setTimeout(function() {
        onPause();
        onResume();
      }, 1);
    });
  }

  function DataReceived() {
    MyHue.Groups["0"] = {name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88"};

    function StateToHTMLColor(State, Model) {
      function ToHexString(In) {
        var Result = Math.floor(In).toString(16);
        return Result.length == 1 ? "0" + Result : Result;
      }

      if (State && State.colormode) { // Group 0 (All available lights) doesn"t have all properties
        Model = Model || "LCT001";
        var RGB;
        var xy;

        if (State.colormode === "hs") {
          RGB = huepi.HelperHueAngSatBritoRGB(State.hue * 360 / 65535, State.sat / 255, State.bri / 255);
          xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
          RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, State.bri / 255, Model);
        } else if (State.colormode === "xy") {
          RGB = huepi.HelperXYtoRGBforModel(State.xy[0], State.xy[1], State.bri / 255, Model);
        } else if (State.colormode === "ct") {
          RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / State.ct));
          xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
          RGB = huepi.HelperXYtoRGBforModel(xy.x, xy.y, State.bri / 255, Model);
        }
        return "#" + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
      } else return "#ffcc88"; 
    }
  
    for (var Key in MyHue.Groups) {
      MyHue.Groups[Key].id = Key;
      MyHue.Groups[Key].HTMLColor = StateToHTMLColor(MyHue.Groups[Key].action);
    }
    for (Key in MyHue.Lights) {
      MyHue.Lights[Key].id = Key;
      MyHue.Lights[Key].HTMLColor = StateToHTMLColor(MyHue.Lights[Key].state);
    }
  }

return {
    MyHue : function () {
      return MyHue;
    },
    Status : function() {
      return Status;
    },
    Connect : function(NewBridgeAddress) {
      return Connect(NewBridgeAddress);
    },
    Scan : function() {
      return Scan();
    }
  };

});


})();



(function () {


angular.module(app.name).controller("HueController", function($scope, hueConnector, Menu) {
  $scope.MyHue = hueConnector.MyHue(); // For conveinient usage of MyHue in HTML within this controllers $scope
  window.hue = hueConnector.MyHue(); // For Debugging TESTCODE
  $scope.UpdateScheduled = false;

  $scope.$watch(function() {
    return hueConnector.Status();
    }, function WatchStatus(NewStatus, OldStatus) {
      if (NewStatus!=="Connected")
        $("#HueStatusbar").slideDown(350);
      else setTimeout(function() { $("#HueStatusbar").slideUp(750); }, 1);
    }
  );

  $scope.$watch(function() {
    return Menu.GetItem();
    }, function WatchStatus(NewItem, OldItem) {
      if (NewItem === "") // No Overlay selected
        $("body").css("overflow", "initial"); // Enable scrolling of the <Body>
      else $("body").css("overflow", "hidden"); // Disable scrolling of the <Body>
    }
  );

  $scope.Status = function() {
    return hueConnector.Status();
  };

  $scope.Connect = function(NewBridgeAddress) {
    return hueConnector.Connect(NewBridgeAddress);
  };

  $scope.Scan = function() {
    return hueConnector.Scan();
  };

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

  $scope.SetMenuItem = function(NewItem, NewId) {
    return Menu.SetItem(NewItem, NewId);
  };

  $scope.MenuItem = function() {
    return Menu.GetItem();
  };

  $scope.MenuId = function() {
    return Menu.GetId();
  };

  document.addEventListener("backbutton", function(event) { // Cordova/PhoneGap only.
    if (angular.element("#HueStatus").scope().MenuItem() !== "") {
      angular.element("#HueStatus").scope().SetMenuItem("Escape");
    }
  });

  document.onkeyup = function(event) {
    if (angular.element("#HueStatus").scope().MenuItem() !== "") {
      // Escape & Enter will close open Overlays.
      if ((event.keyCode === 27)) { // Escape or Backspace
        angular.element("#HueStatus").scope().SetMenuItem("Escape");
      }
      if ((event.keyCode === 13)) { // Enter
        angular.element("#HueStatus").scope().SetMenuItem("");
      }
    }
  };

});


})();



(function () {

  
angular.module(app.name).directive("huewiGroups", function() {
  return {
    restrict: "E",
    templateUrl: "huewi-groups.html"
  };
});

angular.module(app.name).controller("GroupsController", function($scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).directive("huewiLights", function() {
  return {
    restrict: "E",
    templateUrl: "huewi-lights.html"
  };
});

angular.module(app.name).controller("LightsController", function($scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller("GroupAndLightController", function($scope, hueConnector, Menu) {
  var hueImage = new Image();
  hueImage.src = "img/hue.png";
  var ctImage = new Image();
  ctImage.src = "img/ct.png";
  $scope._Name = "Light/Group";
  $scope.OrgName = $scope._Name;

  $scope.$watch(function() {
    return Menu.GetItem();
    }, function WatchStatus(NewItem, OldItem) {
    if (Menu.GetItem() === "Escape") { // a Escape-key is Hit
        if (OldItem === "Group") {
          if (hueConnector.MyHue().Groups[Menu.GetId()].name != $scope.OrgName)
            hueConnector.MyHue().GroupSetName(Menu.GetId(), $scope.OrgName);
        } else if (OldItem=== "Light") {
          if (hueConnector.MyHue().Lights[Menu.GetId()].name != $scope.OrgName)
          hueConnector.MyHue().LightSetName(Menu.GetId(), $scope.OrgName);
        }
    } else { // NewItem Selected
        if (Menu.GetItem() === "Group") {
          hueConnector.MyHue().GroupAlertSelect(Menu.GetId());
          $scope.OrgName = $scope._Name = hueConnector.MyHue().Groups[Menu.GetId()].name;
        } else if (Menu.GetItem() === "Light") {
          hueConnector.MyHue().LightAlertSelect(Menu.GetId());       
          $scope.OrgName = $scope._Name = hueConnector.MyHue().Lights[Menu.GetId()].name;
        }
      }
    }
  );

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
    var hueCanvas = document.getElementById("hueCanvas");
    var hueContext = hueCanvas.getContext("2d");
    var ctCanvas = document.getElementById("ctCanvas");
    var ctContext = ctCanvas.getContext("2d");
    // Canvas size should be set by script not css, otherwise getting HueImagePixel doesn"t match canvas sizes
    if ($(window).width() > $(window).height()) {
      hueCanvas.width = 0.38 * $(window).width();
      if (hueCanvas.width > 0.75 * $(window).height())
        hueCanvas.width = 0.75 * $(window).height();
    } else {
      hueCanvas.width = 0.57 * $(window).width();
      if (hueCanvas.width > 0.95 * $(window).height())
        hueCanvas.width = 0.95 * $(window).height();
    }
    hueCanvas.height = hueCanvas.width;
    hueContext.drawImage(hueImage, 0, 0, hueCanvas.width, hueCanvas.height); // ReDraw
    ctCanvas.width = hueCanvas.width;
    ctCanvas.height = ctCanvas.width / 2;
    ctContext.drawImage(ctImage, 0, 0, ctCanvas.width, ctCanvas.height); // ReDraw
  };

  $("#hueCanvas").on("click", function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var HueContext = document.getElementById("hueCanvas").getContext("2d");
    var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
    var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
    if (Menu.GetItem() === "Group") {
      hueConnector.MyHue().GroupSetRGB(Menu.GetId(), HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    } else if (Menu.GetItem() === "Light") {
      hueConnector.MyHue().LightSetRGB(Menu.GetId(), HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    }
  });

  $("#ctCanvas").on("click", function(event) { // 2000..6500
    var ctGroupCanvas = document.getElementById("ctCanvas");
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctGroupCanvas.width);
    var Brightness = 255 - 255*(y/ctGroupCanvas.height);
    if (Menu.GetItem() === "Group") {
      hueConnector.MyHue().GroupSetColortemperature(Menu.GetId(), ColorTemperature);
      hueConnector.MyHue().GroupSetBrightness(Menu.GetId(), Brightness);
    } else if (Menu.GetItem() === "Light") {
      hueConnector.MyHue().LightSetColortemperature(Menu.GetId(), ColorTemperature);
      hueConnector.MyHue().LightSetBrightness(Menu.GetId(), Brightness);
    }
  });

  $scope.GroupHasLight = function(LightId) {
    if (Menu.GetItem() === "Group") {
      if (Menu.GetId() === "0") return false;
      if (hueConnector.MyHue().Groups[Menu.GetId()].lights.indexOf(LightId)>=0)
        return true;
    }
    return false;
  };
  
  $scope.GroupToggleLight = function(LightId) {
    if (Menu.GetItem() === "Group") {
      hueConnector.MyHue().LightAlertSelect(LightId);
      if ($scope.GroupHasLight(LightId))
        hueConnector.MyHue().Groups[Menu.GetId()].lights.splice(
          hueConnector.MyHue().Groups[Menu.GetId()].lights.indexOf(LightId),1);
      else hueConnector.MyHue().Groups[Menu.GetId()].lights.push(LightId);
      hueConnector.MyHue().GroupSetLights(Menu.GetId(), hueConnector.MyHue().Groups[Menu.GetId()].lights);
    }
  };

  $scope.Name = function(NewName) { // Getter/Setter function
    if (angular.isDefined(NewName))
    { // Set
      $scope._Name = NewName;
      if (Menu.GetItem() === "Group") {
        hueConnector.MyHue().GroupSetName(Menu.GetId(), NewName);
      } else if (Menu.GetItem() === "Light") {
        hueConnector.MyHue().LightSetName(Menu.GetId(), NewName);
      }
    }
    return $scope._Name; // Get
  };

  $scope.SetCTBrightness = function(CT, Brightness) {
    if (Menu.GetItem() === "Group") {
      hueConnector.MyHue().GroupSetCT(Menu.GetId(), CT);
      hueConnector.MyHue().GroupSetBrightness(Menu.GetId(), Brightness);
    } else if (Menu.GetItem() === "Light") {
      hueConnector.MyHue().LightSetCT(Menu.GetId(), CT);
      hueConnector.MyHue().LightSetBrightness(Menu.GetId(), Brightness);
    }    
  };

  $scope.Relax = function(NewName) {
    $scope.SetCTBrightness(467, 144);
  };
  
  $scope.Reading = function(NewName) {
    $scope.SetCTBrightness(343, 240);
  };
  
  $scope.Concentrate = function(NewName) {
    $scope.SetCTBrightness(231, 219);
  };
  
  $scope.Energize = function(NewName) {
    $scope.SetCTBrightness(156, 203);
  };
  
  $scope.GoldenHour = function(NewName) {
    $scope.SetCTBrightness(400, 125);
  };

});


})();



(function () {


angular.module(app.name).controller("SchedulesController", function($scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller("ScenesController", function($scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller("SensorsController", function($scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller("RulesController", function($scope, hueConnector) {
});


})();



(function () {


angular.module(app.name).controller("BridgeController", function($scope, hueConnector) {
  $scope.ManualBridge = hueConnector.MyHue().BridgeIP || "localhost:8000";
});


})();
