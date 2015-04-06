(function () {
  'use strict';

  function closeNavdrawer() {
    $('#navdrawer').hide(750);
    return false;
  }

  function toggleNavdrawer() {
    $('#navdrawer').toggle(350);
    return false;
  }

$(document).ready(function(){
  $('#navbutton').click(function() {
    return toggleNavdrawer();
  });
  $('#navcontainer').click(function (event) {
    if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
      return closeNavdrawer();
    }
    return false;
  });
  document.body.addEventListener('click', closeNavdrawer);
});

})();