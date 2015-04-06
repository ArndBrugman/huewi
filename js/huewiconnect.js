(function() {
  var HeartbeatInterval;
  var PrevStatus;

  if (window.isCordovaApp) {
    document.addEventListener("deviceready", onStartup, false);
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
  } else
    $(document).ready(onStartup);

  window.onload = function() {
    window.onresize();
  }

  window.onresize = function() {
    Redraw();
  }

  function Redraw() {
  }

  $("#window").click(function(event) {
  });

  function onStartup() {
    onResume();
  }

  function onResume() {
    TimeBasedGradientUpdate();
    angular.element(document.getElementById('HueStatusController')).controller().ConnectToHueBridge();
    HeartbeatInterval = window.setInterval(StatusHeartbeat, 2500);
    StatusHeartbeat(); // Execute Immediate Too!
  }

  function onPause() {
    window.clearInterval(HeartbeatInterval);
    $('#HueStatusbar').show(350);
  }

  function StatusHeartbeat() {
    if ((PrevStatus != angular.element(document.getElementById('HueStatusController')).controller().Status) &
      (angular.element(document.getElementById('HueStatusController')).controller().Status === 'Connected')) {
      $('#HueStatusbar').slideUp(750);
    }
    PrevStatus = angular.element(document.getElementById('HueStatusController')).controller().Status;

    if (angular.element(document.getElementById('HueStatusController')).controller().Status === 'Connected')
    {
      angular.element(document.getElementById('HueStatusController')).controller().MyHue.BridgeGetData().then(function UpdateUI() {
        angular.element(document.getElementById('Groups')).controller().Update();
        angular.element(document.getElementById('Lights')).controller().Update();
      }, function BridgeGetDataFailed() {
        setTimeout(function() {
          onPause();
          onResume();
        }, 1000);
      });
    }
  }

})();
