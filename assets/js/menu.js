(function () {
"use strict";

app

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
    SetId : function(NewId) {
      Id = NewId;
    },
    GetId : function() {
      return Id;
    }
  };

});


})();