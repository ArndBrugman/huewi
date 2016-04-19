(function () {
"use strict";

app

.directive("huewiGroupandlight", function() {
  return {
    restrict: "EA",
    templateUrl: "huewi-groupandlight.html",
    controller: "huewiGroupAndLightController"
  };
})

.controller("huewiGroupAndLightController", ["$scope", "hueConnector", "Menu", function($scope, hueConnector, Menu) {
  var hueImage = new Image();
  hueImage.src = "img/hue.png";
  var ctImage = new Image();
  ctImage.src = "img/ct.png";
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
    $scope.SetCTBrightness(467, 144);
  };
  
  $scope.Reading = function() {
    $scope.SetCTBrightness(343, 240);
  };
  
  $scope.Concentrate = function() {
    $scope.SetCTBrightness(231, 219);
  };
  
  $scope.Energize = function() {
    $scope.SetCTBrightness(156, 203);
  };
  
  $scope.GoldenHour = function() {
    $scope.SetCTBrightness(400, 125);
  };

}]);


})();