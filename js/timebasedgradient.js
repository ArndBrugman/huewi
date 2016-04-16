function TimeBasedGradientUpdate() {
  "use strict";

  var timebasedgradients = [ // from http://codepen.io/zessx/pen/rDEAl
    "linear-gradient(to bottom, rgba(0, 0, 12, 0.80) 0%, rgba(0, 0, 12, 0.80) 0%)",
    "linear-gradient(to bottom, rgba(2, 1, 17, 0.80) 85%, rgba(25, 22, 33, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(2, 1, 17, 0.80) 60%, rgba(32, 32, 44, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(2, 1, 17, 0.80) 10%, rgba(58, 58, 82, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(32, 32, 44, 0.80) 0%, rgba(81, 81, 117, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(64, 64, 92, 0.80) 0%, rgba(111, 113, 170, 0.80) 80%, rgba(138, 118, 171, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(74, 73, 105, 0.80) 0%, rgba(112, 114, 171, 0.80) 50%, rgba(205, 130, 160, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(117, 122, 191, 0.80) 0%, rgba(133, 131, 190, 0.80) 60%, rgba(234, 176, 209, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(130, 173, 219, 0.80) 0%, rgba(235, 178, 177, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(148, 197, 248, 0.80) 1%, rgba(166, 230, 255, 0.80) 70%, rgba(177, 181, 234, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(183, 234, 255, 0.80) 0%, rgba(148, 223, 255, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(155, 226, 254, 0.80) 0%, rgba(103, 209, 251, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(144, 223, 254, 0.80) 0%, rgba(56, 163, 209, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(87, 193, 235, 0.80) 0%, rgba(36, 111, 168, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(45, 145, 194, 0.80) 0%, rgba(30, 82, 142, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(36, 115, 171, 0.80) 0%, rgba(30, 82, 142, 0.80) 70%, rgba(91, 121, 131, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(30, 82, 142, 0.80) 0%, rgba(38, 88, 137, 0.80) 50%, rgba(157, 166, 113, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(30, 82, 142, 0.80) 0%, rgba(114, 138, 124, 0.80) 50%, rgba(233, 206, 93, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(21, 66, 119, 0.80) 0%, rgba(87, 110, 113, 0.80) 30%, rgba(225, 196, 94, 0.80) 70%, rgba(178, 99, 57, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(22, 60, 82, 0.80) 0%, rgba(79, 79, 71, 0.80) 30%, rgba(197, 117, 45, 0.80) 60%, rgba(183, 73, 15, 0.80) 80%, rgba(47, 17, 7, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(7, 27, 38, 0.80) 0%, rgba(7, 27, 38, 0.80) 30%, rgba(138, 59, 18, 0.80) 80%, rgba(36, 14, 3, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(1, 10, 16, 0.80) 30%, rgba(89, 35, 11, 0.80) 80%, rgba(47, 17, 7, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(9, 4, 1, 0.80) 50%, rgba(75, 29, 6, 0.80) 100%)",
    "linear-gradient(to bottom, rgba(0, 0, 12, 0.80) 80%, rgba(21, 8, 0, 0.80) 100%)"
  ];

  var timebasedcolors = [
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
    "rgba(250, 240, 230, 0.85)",
  ];

  var index = new Date().getHours();
  //night = 3
  //morning = 5
  //day = 14
  //evening = 22
  if (index <  7) index =  3;
  else if (index <  9) index =  5;
  else if (index < 18) index = 14;
  else if (index < 23) index = 22;
  else index = 3;
  var timebasedgradient = timebasedgradients[index%24];

  $(".timebasedgradient").css("background-image", timebasedgradient);
  //$(".timebasedgradient").css("background-image", timebasedgradients[index]);
  //$(".timebasedgradient").css("background-image", "-webkit-" + timebasedgradients[index]);
  //$(".timebasedgradient").css("background-image", "-moz-" + timebasedgradients[index]);
  //$(".timebasedgradient").css("background-image", "-o-background: " + timebasedgradients[index]);

  $(".timebasedgradient").css("color", timebasedcolors[index%24]);  
}

$(document).ready(TimeBasedGradientUpdate); // Run On Startup
var TimeBasedGradientUpdateInterval = setInterval(TimeBasedGradientUpdate, 5 * 60 * 1000); // Update Every 5 Minutes


