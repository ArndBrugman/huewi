(function () {
"use strict";

app

.directive("huewiGroupandlight", function() {
  return {
    restrict: "EA",
    templateUrl: "app/components/huewi-groupandlight.html",
    controller: "huewiGroupAndLightController"
  };
})

.controller("huewiGroupAndLightController", ["$scope", "hueConnector", "Menu", function($scope, hueConnector, Menu) {
  var hueImage = new Image();
  hueImage.src = "assets/img/hue.png";
  var ctImage = new Image();
  ctImage.src = "assets/img/ct.png";
  $scope._Name = "GroupAndLight";
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
    // Canvas size should be set by script not css, otherwise getting HueImagePixel doesn't match canvas sizes
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
    var HueAngSatBri = huepi.HelperRGBtoHueAngSatBri(HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    if (Menu.GetItem() === "Group") {
      hueConnector.MyHue().GroupSetHueAngSatBri(Menu.GetId(), HueAngSatBri.Ang, HueAngSatBri.Sat, hueConnector.MyHue().Groups[Menu.GetId()].action.bri);
    } else if (Menu.GetItem() === "Light") {
      hueConnector.MyHue().LightSetHueAngSatBri(Menu.GetId(), HueAngSatBri.Ang, HueAngSatBri.Sat, hueConnector.MyHue().Lights[Menu.GetId()].state.bri);
    }
  });

  $("#ctCanvas").on("click", function(event) { // 2000..6500
    var ctGroupCanvas = document.getElementById("ctCanvas");
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2000 + (6500-2000)*(x/ctGroupCanvas.width);
    if (Menu.GetItem() === "Group") {
      hueConnector.MyHue().GroupSetColortemperature(Menu.GetId(), ColorTemperature);
    } else if (Menu.GetItem() === "Light") {
      hueConnector.MyHue().LightSetColortemperature(Menu.GetId(), ColorTemperature);
    }
  });

  $scope.GroupHasLight = function(LightId) {
    if (Menu.GetItem() === "Group") {
      if (Menu.GetId() != "0") {
        if (hueConnector.MyHue().Groups[Menu.GetId()].lights.indexOf(LightId)>=0)
          return true;
      }
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

  $scope.Relax = function() {
    $scope.SetCTBrightness(447, 144);
    //"state":{"on":true,"bri":144,"hue":12585,"sat":224,"effect":"none","xy":[0.5019,0.4152],"ct":447,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.Reading = function() {
    $scope.SetCTBrightness(346, 254);
    //"state":{"on":true,"bri":254,"hue":13524,"sat":200,"effect":"none","xy":[0.4450,0.4067],"ct":346,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.Concentrate = function() {
    $scope.SetCTBrightness(234, 254);
    //"state":{"on":true,"bri":254,"hue":15324,"sat":121,"effect":"none","xy":[0.3698,0.3723],"ct":234,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.Energize = function() {
    $scope.SetCTBrightness(153, 254);
    //"state":{"on":true,"bri":254,"hue":34075,"sat":251,"effect":"none","xy":[0.3144,0.3302],"ct":153,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.Bright = function() {
    $scope.SetCTBrightness(367, 254);
    //"state":{"on":true,"bri":254,"hue":34075,"sat":251,"effect":"none","xy":[0.4578,0.4100],"ct":367,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.Dimmed = function() {
    $scope.SetCTBrightness(365, 77);
    //"state":{"on":true,"bri":77,"hue":14956,"sat":140,"effect":"none","xy":[0.4571,0.4097],"ct":365,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.Nightlight = function() {
    $scope.SetCTBrightness(500, 1);
    //"state":{"on":true,"bri":1,"hue":10778,"sat":251,"effect":"none","xy":[0.5609,0.4042],"ct":500,"alert":"select","colormode":"xy","reachable":true}
  };
  
  $scope.GoldenHour = function() {
    $scope.SetCTBrightness(400, 125);
  };

}]);


})();