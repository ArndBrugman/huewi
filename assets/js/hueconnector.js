(function () {
"use strict";

app

.factory("hueConnector", ["$rootScope", function ($rootScope) {
  var MyHue = new huepi();
  var HeartbeatInterval;
  var Status = "Disconnected";
  var ReconnectInterval;
  // Demo Data while Connecting...
  MyHue.Groups = [{name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88", id:"0"}, 
   {name: "Demo Group", type: "LightGroup", action: {on:"true"}},
   {name: "Living Group", type: "LightGroup", action: {on:"false"}},
   {name: "Dining Group", type: "LightGroup", action: {on:"false"}}, 
   {name: "Demo Room", type: "Room", action: {on:"true"}}, 
   {name: "Living Room", type: "Room", action: {on:"false"}}, 
   {name: "Dining Room", type: "Room", action: {on:"false"}}];
  MyHue.Lights = [{name: "Demo Light", state: {on:"true",reachable:"true"}}, 
   {name: "Living Light", state: {on:"false",reachable:"true"}}, 
   {name: "Dining Light", state: {on:"false",reachable:"true"}}];
  
  if (window.cordova) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else {
    $(document).ready(onStartup);
  }

  function onStartup() {
    onResume();
  }

  function onResume() {
    Connect();
    TimeBasedGradientUpdate(); // After Connect(); for faster (Re)Connection.
    MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges

    ReconnectInterval = setInterval(function() { // Reconnects on Statusses of 'Unable', to retry
      if ((Status.indexOf("Unable")>-1) && (!MyHue.ScanningNetwork)) {
        Connect();
      }
    }, 1234);
  }

  function onPause() {
    clearInterval(HeartbeatInterval);
    clearInterval(ReconnectInterval);
  }

  function SetStatus(NewStatus) {
    Status = NewStatus;
    console.log(Status);
    try {
      $rootScope.$apply(); // Force UI update
    }
    catch (error) {}
  }

  function ReConnect() { // IP is known and stored in MyHue.BridgeIP
    clearInterval(HeartbeatInterval);
    SetStatus("Getting Bridge Config");
    MyHue.BridgeGetDescription();
    MyHue.BridgeGetConfig().then(function() {
      SetStatus("Bridge Config Received, Getting Data");
      MyHue.BridgeGetData().then(function() {
        localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
        localStorage.MyHueBridgeID = MyHue.BridgeID; // Cache BridgeID
        DataReceived();
        SetStatus("Connected");
        HeartbeatInterval = setInterval(onHeartbeat, 2500);
      }, function() {
        SetStatus("Please press connect button on the hue Bridge");
        MyHue.BridgeCreateUser(app.name).then(function() {
          localStorage.MyHueBridgeIP = MyHue.BridgeIP; // Cache BridgeIP
          localStorage.MyHueBridgeID = MyHue.BridgeID; // Cache BridgeID
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
    MyHue.Username = "";
    MyHue.BridgeIP = NewBridgeAddress || MyHue.BridgeIP;
    if (MyHue.BridgeIP !== "") { // Preset/Previous BridgeIP
      ReConnect();
    } else if (localStorage.MyHueBridgeIP) { // Cached BridgeIP
      MyHue.BridgeIP = localStorage.MyHueBridgeIP;
      MyHue.BridgeID = localStorage.MyHueBridgeID;
      MyHue.Username = MyHue.BridgeCache[MyHue.BridgeID];
      SetStatus("Reconnecting");
      MyHue.BridgeGetData().then(function() {
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
    MyHue.Username = "";
    SetStatus("Discovering Bridge via Portal");
    MyHue.PortalDiscoverLocalBridges().then(function() {
      SetStatus("Bridge Discovered");
      ReConnect();
    }, function() { // else
      SetStatus("Unable to discover Bridge via Portal");
    } );
  }

  function Scan() {
    clearInterval(HeartbeatInterval);
    MyHue.Username = "";
    SetStatus("Scanning Network for Bridge");
    MyHue.NetworkDiscoverLocalBridges().then(function() {
      SetStatus("Bridge Found");
      ReConnect();
    }, function() { // else
      SetStatus("Unable to locate Bridge with Network Scan");
    }).progress(function update(Percentage){
      SetStatus("Searching Network for Bridge, "+ Percentage +"% done");
    } );
  }

  function onHeartbeat() {
    MyHue.BridgeGetData().then(function UpdateUI() {
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
    MyHue.Groups["0"] = {name: "All available lights", type: "LightGroup", HTMLColor: "#ffcc88", action: {bri:155}};

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
      MyHue.Lights[Key].HTMLColor = StateToHTMLColor(MyHue.Lights[Key].state, MyHue.Lights[Key].modelid);
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
    Discover : function() {
      return Discover();
    },
    Scan : function() {
      return Scan();
    }
  };

}]);


})();