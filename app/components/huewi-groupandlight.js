(function () {
  'use strict';

  app

  .directive('huewiGroupandlight', function() {
    return {
      restrict: 'EA',
      templateUrl: 'app/components/huewi-groupandlight.html',
      controller: 'huewiGroupAndLightController',
      controllerAs: 'vm',
      scope: {},
      bindToController: true
    };
  })

  .controller('huewiGroupAndLightController', ['$scope', 'hueConnector', 'Menu', function($scope, hueConnector, Menu) {
    var vm = this;

    vm.MyHue = hueConnector.MyHue;
    vm.Menu = Menu;

    vm._Name = 'GroupAndLight';
    vm.OrgName = vm._Name;
    vm.GroupId = '-1';
    vm.LightId = '-1';
    vm.UpdateScheduled = false;

    vm.Name = Name;

    vm.SetGroupId = SetGroupId;
    vm.SetGroupBrightness = SetGroupBrightness;
    vm.SetLightId = SetLightId;
    vm.SetLightBrightness = SetLightBrightness;

    vm.GroupHasLight = GroupHasLight;
    vm.GroupToggleLight = GroupToggleLight;

    vm.Relax = Relax;
    vm.Reading = Reading;
    vm.Concentrate = Concentrate;
    vm.Energize = Energize;
    vm.Bright = Bright;
    vm.Dimmed = Dimmed;
    vm.Nightlight = Nightlight;
    vm.GoldenHour = GoldenHour;

    var hueImage = new Image();
    hueImage.src = 'assets/img/hue.png';
    var ctImage = new Image();
    ctImage.src = 'assets/img/ct.png';

    $scope.$watch(function() {
      return vm.Menu.GetItem();
    }, function WatchStatus(NewItem, OldItem) {
      if (Menu.GetItem() === 'Escape') { // a Escape-key is Hit
        if (OldItem === 'Group') {
          if (vm.MyHue.Groups[Menu.GetId()].name != vm.OrgName)
          vm.MyHue.GroupSetName(Menu.GetId(), vm.OrgName);
        } else if (OldItem=== 'Light') {
          if (vm.MyHue.Lights[Menu.GetId()].name != vm.OrgName)
          vm.MyHue.LightSetName(Menu.GetId(), vm.OrgName);
        }
      } else { // NewItem Selected
        if (Menu.GetItem() === 'Group') {
          vm.MyHue.GroupAlertSelect(Menu.GetId());
          vm.OrgName = vm._Name = vm.MyHue.Groups[Menu.GetId()].name;
        } else if (Menu.GetItem() === 'Light') {
          vm.MyHue.LightAlertSelect(Menu.GetId());
          vm.OrgName = vm._Name = vm.MyHue.Lights[Menu.GetId()].name;
        }
        UpdateMarkers();
      }
    });

    $scope.$watch(function() {
      return vm.MyHue.Lights;
    }, function WatchStatus(NewItem, OldItem) {
      UpdateMarkers();
    });

    hueImage.onload = function() {
      Redraw();
    };

    ctImage.onload = function() {
      Redraw();
    };

    $(window).resize(function(){
      Redraw();
    });

    function Redraw() {
      var hueCanvas = document.getElementById('huewihueCanvas');
      var hueContext = hueCanvas.getContext('2d');
      var ctCanvas = document.getElementById('huewictCanvas');
      var ctContext = ctCanvas.getContext('2d');
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
      UpdateMarkers();
    }

    function UpdateMarkers() {
      var canvasPosition;
      var parentPosition;
      var State;
      var x, y;

      if (Menu.GetItem() === 'Group') {
        State = vm.MyHue.Groups[Menu.GetId()].action;
      } else if (Menu.GetItem() === 'Light') {
        State = vm.MyHue.Lights[Menu.GetId()].state;
      } else return;

      var RGB;
      var HueAngSatBri;
      var xy;
      var Colortemperature = 1000000 / State.ct;

      if (State && State.colormode) { // Group 0 (All available lights) doesn't have all properties
      if (State.colormode === 'hs') {
        RGB = huepi.HelperHueAngSatBritoRGB(State.hue * 360 / 65535, State.sat / 255, State.bri / 255);
        xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
        RGB = huepi.HelperXYtoRGB(xy.x, xy.y, State.bri / 255);
        Colortemperature = huepi.HelperRGBtoColortemperature(RGB.Red, RGB.Green, RGB.Blue);
      } else if (State.colormode === 'xy') {
        RGB = huepi.HelperXYtoRGB(State.xy[0], State.xy[1], State.bri / 255);
        Colortemperature = huepi.HelperRGBtoColortemperature(RGB.Red, RGB.Green, RGB.Blue);
      } else if (State.colormode === 'ct') {
        RGB = huepi.HelperColortemperaturetoRGB(Math.round(1000000 / State.ct));
        xy = huepi.HelperRGBtoXY(RGB.Red, RGB.Green, RGB.Blue);
        RGB = huepi.HelperXYtoRGB(xy.x, xy.y, State.bri / 255);
      }
    }

    HueAngSatBri = huepi.HelperRGBtoHueAngSatBri(RGB.Red, RGB.Green, RGB.Blue);

    x = HueAngSatBri.Sat*Math.sin(HueAngSatBri.Ang/180*Math.PI)*$('#huewihueCanvas').width()/2+$('#huewihueCanvas').width()/2;
    y = HueAngSatBri.Sat*Math.cos(HueAngSatBri.Ang/180*Math.PI)*$('#huewihueCanvas').height()/-2+$('#huewihueCanvas').height()/2;
    canvasPosition = $('#huewihueCanvas').offset();
    parentPosition = $('#huewihueCanvas').parent().offset();
    canvasPosition.left-=parentPosition.left;
    canvasPosition.top-=parentPosition.top;
    $('#huewihueMarker').css('left', x-$('#huewihueMarker').width()/2+canvasPosition.left);
    $('#huewihueMarker').css('top', y-$('#huewihueMarker').height()/2+canvasPosition.top);

    if (Colortemperature < 2200) Colortemperature = 2200;
    if (Colortemperature > 6500) Colortemperature = 6500;
    x = (Colortemperature - 2200)/(6500 - 2200)*$('#huewictCanvas').width();
    y = (1-(State.bri/254))*$('#huewictCanvas').height();
    canvasPosition = $('#huewictCanvas').offset();
    parentPosition = $('#huewictCanvas').parent().offset();
    canvasPosition.left-=parentPosition.left;
    canvasPosition.top-=parentPosition.top;
    $('#huewictMarker').css('left', x-$('#huewictMarker').width()/2+canvasPosition.left);
    $('#huewictMarker').css('top', y-$('#huewictMarker').height()/2+canvasPosition.top);
  }

  $('#huewihueCanvas').on('click', function(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var HueContext = document.getElementById('huewihueCanvas').getContext('2d');
    var HueImagedata = HueContext.getImageData(x, y, 1, 1); // one Pixel at Cursor
    var HueImagePixel = HueImagedata.data; // data[] RGB of Pixel
    var HueAngSatBri = huepi.HelperRGBtoHueAngSatBri(HueImagePixel[0]/255, HueImagePixel[1]/255, HueImagePixel[2]/255);
    if (Menu.GetItem() === 'Group') {
      vm.MyHue.GroupOn(Menu.GetId());
      vm.MyHue.GroupSetHueAngSatBri(Menu.GetId(), HueAngSatBri.Ang, HueAngSatBri.Sat, vm.MyHue.Groups[Menu.GetId()].action.bri/255);
    } else if (Menu.GetItem() === 'Light') {
      vm.MyHue.LightOn(Menu.GetId());
      vm.MyHue.LightSetHueAngSatBri(Menu.GetId(), HueAngSatBri.Ang, HueAngSatBri.Sat, vm.MyHue.Lights[Menu.GetId()].state.bri/255);
    }
    UpdateMarkers();
  });

  $('#huewictCanvas').on('click', function(event) { // 2200..6500
    var ctCanvas = document.getElementById('huewictCanvas');
    var x = event.offsetX;
    var y = event.offsetY;
    var ColorTemperature = 2200 + (6500-2200)*(x/ctCanvas.width);
    if (Menu.GetItem() === 'Group') {
      vm.MyHue.GroupOn(Menu.GetId());
      vm.MyHue.GroupSetColortemperature(Menu.GetId(), ColorTemperature);
    } else if (Menu.GetItem() === 'Light') {
      vm.MyHue.LightOn(Menu.GetId());
      vm.MyHue.LightSetColortemperature(Menu.GetId(), ColorTemperature);
    }
    UpdateMarkers();
  });

  function GroupHasLight(LightId) { // Should move to huepi
    if (Menu.GetItem() === 'Group') {
      if (Menu.GetId() != '0') {
        if (vm.MyHue.Groups[Menu.GetId()].lights.indexOf(LightId)>=0)
        return true;
      }
    }
    return false;
  }

  function GroupToggleLight(LightId) { // Should move to huepi
    if (Menu.GetItem() === 'Group') {
      vm.MyHue.LightAlertSelect(LightId);
      if (GroupHasLight(LightId))
      vm.MyHue.Groups[Menu.GetId()].lights.splice(
        vm.MyHue.Groups[Menu.GetId()].lights.indexOf(LightId),1);
        else vm.MyHue.Groups[Menu.GetId()].lights.push(LightId);
        vm.MyHue.GroupSetLights(Menu.GetId(), vm.MyHue.Groups[Menu.GetId()].lights);
      }
    }

    function Name(NewName) { // Getter/Setter function
      if (angular.isDefined(NewName)) { // Set
        vm._Name = NewName;
        if (Menu.GetItem() === 'Group') {
          vm.MyHue.GroupSetName(Menu.GetId(), NewName);
        } else if (Menu.GetItem() === 'Light') {
          vm.MyHue.LightSetName(Menu.GetId(), NewName);
        }
      }
      return vm._Name; // Get
    }

    function SetGroupId(NewId) {
      vm.GroupId = NewId;
    }

    function SetGroupBrightness(CurrentGroup) {
      if (vm.GroupId ==='-1')
      return;
      if (vm.UpdateScheduled === false)
      {
        vm.UpdateScheduled = true;
        vm.MyHue.GroupSetBrightness(CurrentGroup, vm.MyHue.Groups[CurrentGroup].action.bri, 2).then(function(value) {
          setTimeout(function(){vm.UpdateScheduled = false;},50);
        }, function(reason) {
          setTimeout(function(){vm.UpdateScheduled = false;},50);
        });
      }
    }

    function SetLightId(NewId) {
      vm.LightId = NewId;
    }

    function SetLightBrightness(CurrentLight) {
      if (vm.LightId ==='-1')
      return;
      if (vm.UpdateScheduled === false)
      {
        vm.UpdateScheduled = true;
        vm.MyHue.LightSetBrightness(CurrentLight, vm.MyHue.Lights[CurrentLight].state.bri, 2).then(function(value) {
          setTimeout(function(){vm.UpdateScheduled = false;},50);
        }, function(reason) {
          setTimeout(function(){vm.UpdateScheduled = false;},50);
        });
      }
    }

    function SetCTBrightness(CT, Brightness) {
      if (Menu.GetItem() === 'Group') {
        vm.MyHue.GroupOn(Menu.GetId());
        vm.MyHue.GroupSetCT(Menu.GetId(), CT);
        vm.MyHue.GroupSetBrightness(Menu.GetId(), Brightness);
      } else if (Menu.GetItem() === 'Light') {
        vm.MyHue.LightOn(Menu.GetId());
        vm.MyHue.LightSetCT(Menu.GetId(), CT);
        vm.MyHue.LightSetBrightness(Menu.GetId(), Brightness);
      }
    }

    function Relax() {
      SetCTBrightness(447, 144);
      //'state':{'on':true,'bri':144,'hue':12585,'sat':224,'effect':'none','xy':[0.5019,0.4152],'ct':447,'alert':'select','colormode':'xy','reachable':true}
    }

    function Reading() {
      SetCTBrightness(346, 254);
      //'state':{'on':true,'bri':254,'hue':13524,'sat':200,'effect':'none','xy':[0.4450,0.4067],'ct':346,'alert':'select','colormode':'xy','reachable':true}
    }

    function Concentrate() {
      SetCTBrightness(234, 254);
      //'state':{'on':true,'bri':254,'hue':15324,'sat':121,'effect':'none','xy':[0.3698,0.3723],'ct':234,'alert':'select','colormode':'xy','reachable':true}
    }

    function Energize() {
      SetCTBrightness(153, 254);
      //'state':{'on':true,'bri':254,'hue':34075,'sat':251,'effect':'none','xy':[0.3144,0.3302],'ct':153,'alert':'select','colormode':'xy','reachable':true}
    }

    function Bright() {
      SetCTBrightness(367, 254);
      //'state':{'on':true,'bri':254,'hue':34075,'sat':251,'effect':'none','xy':[0.4578,0.4100],'ct':367,'alert':'select','colormode':'xy','reachable':true}
    }

    function Dimmed() {
      SetCTBrightness(365, 77);
      //'state':{'on':true,'bri':77,'hue':14956,'sat':140,'effect':'none','xy':[0.4571,0.4097],'ct':365,'alert':'select','colormode':'xy','reachable':true}
    }

    function Nightlight() {
      SetCTBrightness(500, 1);
      //'state':{'on':true,'bri':1,'hue':10778,'sat':251,'effect':'none','xy':[0.5609,0.4042],'ct':500,'alert':'select','colormode':'xy','reachable':true}
    }

    function GoldenHour() {
      SetCTBrightness(400, 125);
    }

  }]);


})();
