(function () {
  'use strict';

  app

  .factory('hueConnector', ['$rootScope', function ($rootScope) {
    var vm = this;

    vm.MyHue = new huepi();
    // Demo Data while Connecting...
    vm.MyHue.Lights['7001'] = {name: 'Demo Light'};
    vm.MyHue.Lights['7002'] = {name: 'Living Light'};
    vm.MyHue.Lights['7003'] = {name: 'Dining Light'};
    vm.MyHue.Groups['9101'] = {name: 'Demo Group', type: 'LightGroup'};
    vm.MyHue.Groups['9102'] = {name: 'Living Group', type: 'LightGroup'};
    vm.MyHue.Groups['9103'] = {name: 'Dining Group', type: 'LightGroup'};
    vm.MyHue.Groups['9201'] = {name: 'Demo Room', type: 'Room'};
    vm.MyHue.Groups['9202'] = {name: 'Living Room', type: 'Room'};
    vm.MyHue.Groups['9203'] = {name: 'Dining Room', type: 'Room'};
    vm.MyHue.Groups['9101'].lights=vm.MyHue.Groups['9102'].lights=vm.MyHue.Groups['9103'].lights=["7001","7002"];
    vm.MyHue.Groups['9201'].lights=vm.MyHue.Groups['9202'].lights=vm.MyHue.Groups['9203'].lights=["7003","7002"];
    vm.MyHue.Lights['7001'].state={'on':true,'bri':141,'xy':[0.5,0.4],'colormode':'xy','reachable':true};
    vm.MyHue.Lights['7002'].state={'on':true,'bri':152,'xy':[0.4,0.5],'colormode':'xy','reachable':true};
    vm.MyHue.Lights['7003'].state={'on':true,'bri':163,'xy':[0.5,0.5],'colormode':'xy','reachable':true};
    vm.MyHue.Groups['9101'].action={'on':true,'bri':131,'xy':[0.5,0.4],'colormode':'xy','reachable':true};
    vm.MyHue.Groups['9102'].action={'on':true,'bri':142,'xy':[0.4,0.5],'colormode':'xy','reachable':true};
    vm.MyHue.Groups['9103'].action={'on':true,'bri':153,'xy':[0.5,0.5],'colormode':'xy','reachable':true};
    vm.MyHue.Groups['9201'].action={'on':true,'bri':161,'xy':[0.5,0.4],'colormode':'xy','reachable':true};
    vm.MyHue.Groups['9202'].action={'on':true,'bri':172,'xy':[0.4,0.5],'colormode':'xy','reachable':true};
    vm.MyHue.Groups['9203'].action={'on':true,'bri':183,'xy':[0.5,0.5],'colormode':'xy','reachable':true};
    DataReceived();

    vm.Status = 'Disconnected';

    var HeartbeatInterval = -1;
    var ReConnectInterval = -1;

    ReConnectInterval = setInterval(function MaintainConnection() {
      if ((vm.Status.indexOf('Unable')>-1) && (!vm.MyHue.ScanningNetwork)) {
        Connect();
      }
    }, 1500);

    var Service = {
      MyHue: vm.MyHue,
      Startup: Startup,
      Pause: Pause,
      Resume: Resume,
      GetStatus: GetStatus,
      Connect: Connect,
      Discover: Discover,
      Scan: Scan
    };

    return Service;


    function Startup() {
      Resume();
    }

    function Pause() {
      clearInterval(HeartbeatInterval);
      HeartbeatInterval = -1;
    }

    function Resume() {
      TimeBasedGradientUpdate(); // Immediate for correct Colors
      Connect();
      vm.MyHue.PortalDiscoverLocalBridges(); // Parallel PortalDiscoverLocalBridges
    }

    function GetStatus() {
      return vm.Status;
    }

    function SetStatus(NewStatus) {
      vm.Status = NewStatus;
      console.log(vm.Status);
      setTimeout(function() {
        try {
          $rootScope.$apply(); // Force UI update
        } catch (error) {}
      }, 1);
    }

    // IP,ID & Username is known and stored in vm.MyHue.IP,ID & Username
    function ResumeConnection() {
      vm.MyHue.BridgeGetData().then(function() {
        localStorage.MyHueBridgeIP = vm.MyHue.BridgeIP; // Cache BridgeIP
        DataReceived();
        SetStatus('Connected');
        HeartbeatInterval = setInterval(onHeartbeat, 2500);
      }, function() {
        SetStatus('Please press connect button on the hue Bridge');
        vm.MyHue.BridgeCreateUser(app.name).then(function() {
          localStorage.MyHueBridgeIP = vm.MyHue.BridgeIP; // Cache BridgeIP
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
      HeartbeatInterval = -1;
      SetStatus('Getting Bridge Config');
      vm.MyHue.BridgeGetDescription();
      vm.MyHue.BridgeGetConfig().then(function() {
        SetStatus('Bridge Config Received, Getting Data');
        ResumeConnection();
      }, function() {
        SetStatus('Unable to Retreive Bridge Configuration');
        delete localStorage.MyHueBridgeIP; // un-Cache BridgeIP
      } );
    }

    //Entry Point for Starting a Connection
    function Connect(NewBridgeAddress) {
      clearInterval(HeartbeatInterval);
      HeartbeatInterval = -1;
      vm.MyHue.BridgeIP = NewBridgeAddress || localStorage.MyHueBridgeIP || '';
      vm.MyHue.BridgeID = '';
      vm.MyHue.Username = '';
      if (vm.MyHue.BridgeIP !== '') {
        ReConnect();
      } else Discover();
    }

    function Discover() {
      clearInterval(HeartbeatInterval);
      HeartbeatInterval = -1;
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
      HeartbeatInterval = -1;
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
        HeartbeatInterval = -1;
        SetStatus('Unable to receive Bridge Data');
      } );
    }

    function DataReceived() {
      vm.MyHue.Groups['0'] = {name: 'All available lights', type: 'LightGroup', action: {'xy':[0.5019,0.4152],'colormode':'xy'}};

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
