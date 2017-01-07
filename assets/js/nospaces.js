(function () {
"use strict";

app

.filter("noSpaces", function() {
  return function(items) {
    if (!items) return items;
    Object.keys(items).forEach(function(key){
      Object.keys(items[key]).forEach(function(id){
        var newid=id.replace(" ", "_"); 
        if (newid!==id) // Duplicate messy spaces attribute names to underscored fields
          items[key][newid] = items[key][id];
      });
    });
    return items;
  };
});


})();