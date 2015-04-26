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
    $('#HueStatus').scope().ConnectToHueBridge();
    HeartbeatInterval = window.setInterval(StatusHeartbeat, 2500);
    StatusHeartbeat(); // Execute Immediate Too!
  }

  function onPause() {
    window.clearInterval(HeartbeatInterval);
    $('#HueStatusbar').show(350);
  }

  function StatusHeartbeat() {
    if ((PrevStatus != $('#HueStatus').scope().Status) &
      ($('#HueStatus').scope().Status === 'Connected')) {
      $('#HueStatusbar').slideUp(750);
    }
    PrevStatus = $('#HueStatus').scope().Status;

    if ($('#HueStatus').scope().Status === 'Connected')
    {
      $('#HueStatus').scope().Update().then(function UpdateUI() {
        $('#Groups').scope().Update();
        $('#Lights').scope().Update();
      }, function BridgeGetDataFailed() {
        setTimeout(function() {
          onPause();
          onResume();
        }, 1000);
      });
    } else $('#HueStatus').scope().ConnectToHueBridge();
  }

})();
