(function () {
"use strict";

app

.filter("addKey", function() {
  return function(items) {
  	if (!items) return items;
    Object.keys(items).forEach(function(key){
      items[key].__key = key; // Add key as __key in items
    });
    return items;
  };
});


})();