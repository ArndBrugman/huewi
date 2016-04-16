(function () {
"use strict";

angular.module(app.name)

.factory("hueConnector", function ($rootScope) {
  var MyHue = new huepi();
  var HeartbeatInterval;
  var Status = "";
  // Show this Demo Data while Connecting...
  MyHue.Groups = [{name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88", id:"0"}, {name: "Group1"}, {name: "Group2"}, {name: "Group3"}];
  MyHue.Lights = [{name: "Light1"}, {name: "Light2"}, {name: "Light3"}];
  
  if (window.cordova) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else {
    setTimeout(function() { $(document).ready(onStartup); }, 1000);
  }

  function onStartup() {
    onResume();
  }

  function onResume() {
    TimeBasedGradientUpdate();
    MyHue.PortalDiscoverLocalBridges(); // Parallel
    Connect();
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
    setTimeout(function() {
      if ((Status != "Connected") && !MyHue.ScanningNetwork)
        Connect();
    }, 5000);
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