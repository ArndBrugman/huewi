(function () {
  'use strict';

  function closeNavdrawer() {
    $('#navdrawer').hide(450);
    return false;
  }

  function toggleNavdrawer() {
    $('#navdrawer').toggle(200);
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
    document.body.addEventListener('keyup', function(event) {
      if (event.keyCode === 27) {
        closeNavdrawer();
      }
    });
  });

})();
