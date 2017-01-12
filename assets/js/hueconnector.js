(function () {
"use strict";

app

.factory("hueConnector", ["$rootScope", function ($rootScope) {
  var vm = this;

  vm.MyHue = new huepi();
  // Demo Data while Connecting...
  vm.MyHue.Groups = [{name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88", id:"0"},
   {name: "Demo Group", type: "LightGroup", action: {on:"true"}},
   {name: "Living Group", type: "LightGroup", action: {on:"false"}},
   {name: "Dining Group", type: "LightGroup", action: {on:"false"}},
   {name: "Demo Room", type: "Room", action: {on:"true"}},
   {name: "Living Room", type: "Room", action: {on:"false"}},
   {name: "Dining Room", type: "Room", action: {on:"false"}}];
  vm.MyHue.Lights = [{name: "Demo Light", state: {on:"true",reachable:"true"}},
   {name: "Living Light", state: {on:"false",reachable:"true"}},
   {name: "Dining Light", state: {on:"false",reachable:"true"}}];

  vm.Status = "Disconnected";

  var Service = {
    MyHue: vm.MyHue,
    GetStatus: function(){return vm.Status},
    Connect: Connect,
    Discover: Discover,
    Scan: Scan
  };

  var HeartbeatInterval;
  var ReconnectInterval;

  if (window.cordova) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else {
    $(document).ready(onStartup);
  }

  return Service;

  function onStartup() {
    onResume();
  }

  function onResume() {
    Connect();
    TimeBasedGradientUpdate(); // After Connect(); for faster (Re)Connection.
    vm.MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges

    ReconnectInterval = setInterval(function() { // Reconnects on Statusses of 'Unable', to retry
      if ((vm.Status.indexOf("Unable")>-1) && (!vm.MyHue.ScanningNetwork)) {
        Connect();
      }
    }, 1234);
  }

  function onPause() {
    clearInterval(HeartbeatInterval);
    clearInterval(ReconnectInterval);
  }

  function SetStatus(NewStatus) {
    vm.Status = NewStatus;
    console.log(vm.Status);
    try {
      $rootScope.$apply(); // Force UI update
    }
    catch (error) {}
  }

  function ReConnect() { // IP is known and stored in vm.MyHue.BridgeIP
    clearInterval(HeartbeatInterval);
    SetStatus("Getting Bridge Config");
    vm.MyHue.BridgeGetDescription();
    vm.MyHue.BridgeGetConfig().then(function() {
      SetStatus("Bridge Config Received, Getting Data");
      vm.MyHue.BridgeGetData().then(function() {
        localStorage.MyHueBridgeIP = vm.MyHue.BridgeIP; // Cache BridgeIP
        localStorage.MyHueBridgeID = vm.MyHue.BridgeID; // Cache BridgeID
        DataReceived();
        SetStatus("Connected");
        HeartbeatInterval = setInterval(onHeartbeat, 2500);
      }, function() {
        SetStatus("Please press connect button on the hue Bridge");
        vm.MyHue.BridgeCreateUser(app.name).then(function() {
          localStorage.MyHueBridgeIP = vm.MyHue.BridgeIP; // Cache BridgeIP
          localStorage.MyHueBridgeID = vm.MyHue.BridgeID; // Cache BridgeID
          SetStatus("Connected");
          HeartbeatInterval = setInterval(onHeartbeat, 2500);
        }, function() {
          SetStatus("Unable to Whitelist, Please press connect button on the hue Bridge");
        });
      });
    }, function() {
      SetStatus("Unable to Retreive Bridge Configuration");
      delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
      delete localStorage.MyHueBridgeID; // un-Cache BridgeID
    } );
  }

  function Connect(NewBridgeAddress) { // IP is Unknown, Fetch it and ReConnect on it
    clearInterval(HeartbeatInterval);
    vm.MyHue.Username = "";
    vm.MyHue.BridgeIP = NewBridgeAddress || vm.MyHue.BridgeIP;
    if (vm.MyHue.BridgeIP !== "") { // Preset/Previous BridgeIP
      ReConnect();
    } else if (localStorage.MyHueBridgeIP) { // Cached BridgeIP
      vm.MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      vm.MyHue.BridgeID = localStorage.MyHueBridgeID;
      vm.MyHue.Username = vm.MyHue.BridgeCache[vm.MyHue.BridgeID];
      SetStatus("Reconnecting");
      vm.MyHue.BridgeGetData().then(function() {
        DataReceived();
        SetStatus("Connected");
        HeartbeatInterval = setInterval(onHeartbeat, 2500);
      }, function() {
        SetStatus("Unable to Retreive Bridge Data");
        delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
        delete localStorage.MyHueBridgeID; // un-Cache BridgeID
        Discover();
      } );
    } else {
      Discover();
    }
  }

  function Discover() {
    clearInterval(HeartbeatInterval);
    vm.MyHue.Username = "";
    SetStatus("Discovering Bridge via Portal");
    vm.MyHue.PortalDiscoverLocalBridges().then(function() {
      SetStatus("Bridge Discovered");
      ReConnect();
    }, function() { // else
      SetStatus("Unable to discover Bridge via Portal");
    } );
  }

  function Scan() {
    clearInterval(HeartbeatInterval);
    vm.MyHue.Username = "";
    SetStatus("Scanning Network for Bridge");
    vm.MyHue.NetworkDiscoverLocalBridges().then(function() {
      SetStatus("Bridge Found");
      ReConnect();
    }, function() { // else
      SetStatus("Unable to locate Bridge with Network Scan");
    }).progress(function update(Percentage){
      SetStatus("Searching Network for Bridge, "+ Percentage +"% done");
    } );
  }

  function onHeartbeat() {
    vm.MyHue.BridgeGetData().then(function UpdateUI() {
      DataReceived();
      $rootScope.$apply();
    }, function BridgeGetDataFailed() {
      SetStatus("Disconnected");
      setTimeout(function() {
        onPause();
        onResume();
      }, 1);
    } );
  }

  function DataReceived() {
    vm.MyHue.Groups["0"] = {name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88", action: {bri:123}};

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

    var LightsOnBrightness = 0;
    var LightsOnCount = 0;
    for (Key in vm.MyHue.Lights) {
      vm.MyHue.Lights[Key].id = Key;
      vm.MyHue.Lights[Key].HTMLColor = StateToHTMLColor(vm.MyHue.Lights[Key].state, vm.MyHue.Lights[Key].modelid);
      if (vm.MyHue.Lights[Key].state.on) {
        LightsOnCount ++;
        LightsOnBrightness += vm.MyHue.Lights[Key].state.bri;
      }
    }
    vm.MyHue.Groups["0"].action.bri = Math.round(LightsOnBrightness / LightsOnCount);

    for (var Key in vm.MyHue.Groups) {
      vm.MyHue.Groups[Key].id = Key;
      vm.MyHue.Groups[Key].HTMLColor = StateToHTMLColor(vm.MyHue.Groups[Key].action);
    }
  }

}]);


})();
