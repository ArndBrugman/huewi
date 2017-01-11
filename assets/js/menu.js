(function () {
"use strict";

app

.factory("Menu", function() {
  var Item = "Connecting";
  var Id = "";
  
  var Service = {
    SetItem: SetItem,
    GetItem: GetItem,
    SetId: SetId,
    GetId: GetId
  };

  function SetItem(NewItem, NewId) {
    Item = NewItem;
    if (NewId)
      Id = NewId;
  };

  function GetItem() {
    return Item;
  };

  function SetId(NewId) {
    Id = NewId;
  };

  function GetId() {
    return Id;
  };

  return Service;
});


})();