(function () {
'use strict';

app

.filter('asArray', function() {
  return function(items) {
    if (!items) return items;
    var asArray = []; // Add items in the Array
    Object.keys(items).forEach(function(key){
      asArray.push(items[key]);
    });
    return asArray;
  };
});


})();
