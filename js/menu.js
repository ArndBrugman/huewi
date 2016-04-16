(function () {
"use strict";

angular.module(app.name)

.factory("Menu", function() {
  var Item = "Connecting";
  var Id = "";
  
  return {
    SetItem : function(NewItem, NewId) {
      Item = NewItem;
      if (NewId)
        Id = NewId;
    },
    GetItem : function() {
      return Item;
    },
    GetId : function() {
      return Id;
    }
  };

});


})();