function TimeBasedGradientUpdate() {

  var timebasedgradients = [ // from http://codepen.io/zessx/pen/rDEAl
    "linear-gradient(to bottom, #00000c 0%,#00000c 0%)",
    "linear-gradient(to bottom, #020111 85%,#191621 100%)",
    "linear-gradient(to bottom, #020111 60%,#20202c 100%)",
    "linear-gradient(to bottom, #020111 10%,#3a3a52 100%)",
    "linear-gradient(to bottom, #20202c 0%,#515175 100%)",
    "linear-gradient(to bottom, #40405c 0%,#6f71aa 80%,#8a76ab 100%)",
    "linear-gradient(to bottom, #4a4969 0%,#7072ab 50%,#cd82a0 100%)",
    "linear-gradient(to bottom, #757abf 0%,#8583be 60%,#eab0d1 100%)",
    "linear-gradient(to bottom, #82addb 0%,#ebb2b1 100%)",
    "linear-gradient(to bottom, #94c5f8 1%,#a6e6ff 70%,#b1b5ea 100%)",
    "linear-gradient(to bottom, #b7eaff 0%,#94dfff 100%)",
    "linear-gradient(to bottom, #9be2fe 0%,#67d1fb 100%)",
    "linear-gradient(to bottom, #90dffe 0%,#38a3d1 100%)",
    "linear-gradient(to bottom, #57c1eb 0%,#246fa8 100%)",
    "linear-gradient(to bottom, #2d91c2 0%,#1e528e 100%)",
    "linear-gradient(to bottom, #2473ab 0%,#1e528e 70%,#5b7983 100%)",
    "linear-gradient(to bottom, #1e528e 0%,#265889 50%,#9da671 100%)",
    "linear-gradient(to bottom, #1e528e 0%,#728a7c 50%,#e9ce5d 100%)",
    "linear-gradient(to bottom, #154277 0%,#576e71 30%,#e1c45e 70%,#b26339 100%)",
    "linear-gradient(to bottom, #163c52 0%,#4f4f47 30%,#c5752d 60%,#b7490f 80%,#2f1107 100%)",
    "linear-gradient(to bottom, #071b26 0%,#071b26 30%,#8a3b12 80%,#240e03 100%)",
    "linear-gradient(to bottom, #010a10 30%,#59230b 80%,#2f1107 100%)",
    "linear-gradient(to bottom, #090401 50%,#4b1d06 100%)",
    "linear-gradient(to bottom, #00000c 80%,#150800 100%)"
  ];

  var timebasedcolors = [
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
    "#faf0e6",
  ];

  var index = new Date().getHours();
  var timebasedgradient = timebasedgradients[index%24] +' no-repeat left top fixed ';

  $(".timebasedgradient").css("background", timebasedgradient);
  //$(".timebasedgradient").css("background-image:", timebasedgradients[index]);
  //$(".timebasedgradient").css("background-image:", "-webkit-" + timebasedgradients[index]);
  //$(".timebasedgradient").css("background-image:", "-moz-" + timebasedgradients[index]);
  //$(".timebasedgradient").css("background-image:", "-o-background: " + timebasedgradients[index]);

  $(".timebasedgradient").css("color", timebasedcolors[index%24]);  
}

$(document).ready(TimeBasedGradientUpdate); // Run On Startup
var TimeBasedGradientUpdateInterval = setInterval(TimeBasedGradientUpdate, 5 * 60 * 1000); // Update Every 5 Minutes


