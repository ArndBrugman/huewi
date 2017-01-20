(function () {
  'use strict';

  app

  .factory('hueConnector', ['$rootScope', function ($rootScope) {
    var vm = this;

    vm.MyHue = new huepi();
    // Demo Data while Connecting...
    vm.MyHue.Lights = [{name: 'Demo Light'},
    {name: 'Living Light'},
    {name: 'Dining Light'}];
    vm.MyHue.Groups = [{name: 'All available lights', type: 'LightGroup', HTMLColor: '#ffcc88', id:'0'},
    {name: 'Demo Group', type: 'LightGroup'},
    {name: 'Living Group', type: 'LightGroup'},
    {name: 'Dining Group', type: 'LightGroup'},
    {name: 'Demo Room', type: 'Room'},
    {name: 'Living Room', type: 'Room'},
    {name: 'Dining Room', type: 'Room'}];
    vm.MyHue.Lights[0].state=vm.MyHue.Lights[1].state=vm.MyHue.Lights[2].state=
    vm.MyHue.Groups[0].action=vm.MyHue.Groups[1].action=vm.MyHue.Groups[2].action=vm.MyHue.Groups[3].action=
    vm.MyHue.Groups[4].action=vm.MyHue.Groups[5].action=vm.MyHue.Groups[6].action=
    {'on':true,'bri':144,'hue':12585,'sat':224,'effect':'none','xy':[0.5019,0.4152],'ct':447,'alert':'select','colormode':'xy','reachable':true};
    DataReceived();

    vm.Status = 'Disconnected';

    var HeartbeatInterval;

    if (window.cordova) {
      document.addEventListener('deviceready', onStartup, false);
      document.addEventListener('pause', onPause, false);
      document.addEventListener('resume', onResume, false);
    } else {
      $(document).ready(onStartup);
    }

    $rootScope.$watch(function() {
      return GetStatus();
    }, function WatchStatus(NewStatus, OldStatus) {
      if ((vm.Status.indexOf('Unable')>-1) && (!vm.MyHue.ScanningNetwork))
      setTimeout(Connect, 500);
    });

    var Service = {
      MyHue: vm.MyHue,
      GetStatus: GetStatus,
      Connect: Connect,
      Discover: Discover,
      Scan: Scan
    };

    return Service;

    function onStartup() {
      onResume();
    }

    function onResume() {
      TimeBasedGradientUpdate(); // Immidiate for correct Colors
      Connect();
      vm.MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges
    }

    function onPause() {
      clearInterval(HeartbeatInterval);
    }

    function GetStatus() {
      return vm.Status;
    }

    function SetStatus(NewStatus) {
      vm.Status = NewStatus;
      console.log(vm.Status);
      try {
        $rootScope.$apply(); // Force UI update
      }
      catch (error) {}
    }

    // IP,ID & Username is known and stored in vm.MyHue.IP,ID & Username
    function ResumeConnection() {
      vm.MyHue.BridgeGetData().then(function() {
        localStorage.MyHueBridgeIP = vm.MyHue.BridgeIP; // Cache BridgeIP
        localStorage.MyHueBridgeID = vm.MyHue.BridgeID; // Cache BridgeID
        DataReceived();
        SetStatus('Connected');
        HeartbeatInterval = setInterval(onHeartbeat, 2500);
      }, function() {
        SetStatus('Please press connect button on the hue Bridge');
        vm.MyHue.BridgeCreateUser(app.name).then(function() {
          localStorage.MyHueBridgeIP = vm.MyHue.BridgeIP; // Cache BridgeIP
          localStorage.MyHueBridgeID = vm.MyHue.BridgeID; // Cache BridgeID
          SetStatus('Connected');
          HeartbeatInterval = setInterval(onHeartbeat, 2500);
        }, function() {
          SetStatus('Unable to Whitelist, Please press connect button on the hue Bridge');
        });
      });
    }

    // IP is known and stored in vm.MyHue.BridgeIP
    function ReConnect() {
      clearInterval(HeartbeatInterval);
      SetStatus('Getting Bridge Config');
      vm.MyHue.BridgeGetDescription();
      vm.MyHue.BridgeGetConfig().then(function() {
        SetStatus('Bridge Config Received, Getting Data');
        ResumeConnection();
      }, function() {
        SetStatus('Unable to Retreive Bridge Configuration');
        delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
        delete localStorage.MyHueBridgeID; // un-Cache BridgeID
      } );
    }

    //Entry Point for Starting a Connection
    function Connect(NewBridgeAddress) {
      clearInterval(HeartbeatInterval);
      vm.MyHue.BridgeIP = NewBridgeAddress || localStorage.MyHueBridgeIP || '';
      vm.MyHue.BridgeID = localStorage.MyHueBridgeID || '';
      vm.MyHue.Username = vm.MyHue.BridgeCache[vm.MyHue.BridgeID];
      if ((vm.MyHue.BridgeIP !== '') && (vm.MyHue.BridgeID !== '') && (vm.MyHue.Username !== '')) {
        ResumeConnection();
      } else if (vm.MyHue.BridgeIP !== '') {
        ReConnect();
      } else Discover();
    }

    function Discover() {
      clearInterval(HeartbeatInterval);
      vm.MyHue.BridgeIP = '';
      vm.MyHue.BridgeID = '';
      vm.MyHue.Username = '';
      SetStatus('Discovering Bridge via Portal');
      vm.MyHue.PortalDiscoverLocalBridges().then(function() {
        SetStatus('Bridge Discovered');
        ReConnect();
      }, function() { // else
        SetStatus('Unable to discover Bridge via Portal');
      } );
    }

    function Scan() {
      clearInterval(HeartbeatInterval);
      vm.MyHue.BridgeIP = '';
      vm.MyHue.BridgeID = '';
      vm.MyHue.Username = '';
      SetStatus('Scanning Network for Bridge');
      vm.MyHue.NetworkDiscoverLocalBridges().then(function() {
        SetStatus('Bridge Found');
        ReConnect();
      }, function() { // else
        SetStatus('Unable to locate Bridge with Network Scan');
      }).progress(function update(Percentage){
        SetStatus('Searching Network for Bridge, '+ Percentage +'% done');
      } );
    }

    function onHeartbeat() {
      vm.MyHue.BridgeGetData().then(function UpdateUI() {
        DataReceived();
        $rootScope.$apply();
      }, function BridgeGetDataFailed() {
        clearInterval(HeartbeatInterval);
        SetStatus('Unable to receive Bridge Data');
      } );
    }

    function DataReceived() {
      vm.MyHue.Groups['0'] = {name: 'All available lights', type: 'LightGroup', HTMLColor: '#ffcc88', action: {'xy':[0.5019,0.4152],'colormode':'xy'}};

      function StateToHTMLColor(State, Model) {
        function ToHexString(In) {
          var Result = Math.floor(In).toString(16);
          return Result.length == 1 ? '0' + Result : Result;
        }

        if (State && State.colormode) { // Group 0 (All available lights) doesn't have all properties
        Model = Model || 'LCT001';
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
        return '#' + ToHexString(RGB.Red * 255) + ToHexString(RGB.Green * 255) + ToHexString(RGB.Blue * 255);
      } else return '#ffcc88'; }

      var LightsOnBrightness = 0;
      var LightsOnCount = 0;
      for (var Key in vm.MyHue.Lights) {
        vm.MyHue.Lights[Key].id = Key;
        vm.MyHue.Lights[Key].HTMLColor = StateToHTMLColor(vm.MyHue.Lights[Key].state, vm.MyHue.Lights[Key].modelid);
        if (vm.MyHue.Lights[Key].state.on) {
          LightsOnCount ++;
          LightsOnBrightness += vm.MyHue.Lights[Key].state.bri;
        }
      }

      vm.MyHue.Groups['0'].action.bri = Math.round(LightsOnBrightness / LightsOnCount);
      vm.MyHue.Groups['0'].HTMLColor = StateToHTMLColor(vm.MyHue.Groups['0'].action);

      for (Key in vm.MyHue.Groups) {
        vm.MyHue.Groups[Key].id = Key;
        vm.MyHue.Groups[Key].HTMLColor = StateToHTMLColor(vm.MyHue.Groups[Key].action);
      }
    }

  }]);


})();
