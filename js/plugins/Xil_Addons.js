/*:
*
*@plugindesc Addon for random chests
*on the map
*
*@author Xillith
*
*@param CurrentMapVar
*@desc Variable that the current Map is stored in
*@default 1
*
*
*@param ItemChest
*@desc Chance a common chest will appear
*@default 45
*
*@param CrystalChance
*@desc Chance a Crystal chest will appear
*@default 35
*
*@param HealingChance
*@desc Chance a common chest will appear 
*@default 25
*
*@param GoldChests
*@desc Not actual value. Remainder of 3 above.
*@default 5
*
*@help
*
*Plugin Command to roll random chest type: 
*ChestType
*
*Really just self switches between A,B,C,D; A=item chest, B=Crystal Chest ; C= Healing chest; D=epic chest
*
*Plugin Comman to roll random common item:
*RollItem
*
*Plugin Command to roll random epic item: 
*RollEpicItem
*
*Notetag to designate a common item of level X (X being the level the item is found in)
*<Common Item Level: X>
*
*Notetag to designate a epic item of level X (X being the level the item is found in)
*<Rare Item Level: X>
*
*Include the notetag multiple times if you want the item to show up on multiple levels. 
*
*
*/

(function(){

    var parameters = PluginManager.parameters('Xil_Addons');
    var $gameInterp = new Game_Interpreter();
    var CommonLoot = [[]];
    var RareLoot = [[]];

    var NoteTagsLoaded=false;
//Waiting for DataManager before doing notetags
        var _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
        DataManager.isDatabaseLoaded = function () {
            if (_DataManager_isDatabaseLoaded.call(this) === false) {
                return false;
            }
            if (!NoteTagsLoaded) {
                FillDatabase();
               
                NoteTagsLoaded = true;
            }
        return true;
        };
    
        

	var _Game_Interprete_pluginCommand=Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
    // to be overridden by plugins
		_Game_Interprete_pluginCommand.call(this,command);

		var CurrentMapVar;
		var CurrentFloor;

		if (command == 'ChestType') {

		    var ItemChest = Number(parameters['ItemChest']);
		    var CrystalChest = Number(parameters['CrystalChance'])+ItemChest;
		    var HealingChest = Number(parameters['HealingChance']) + CrystalChest;
		    CurrentMapVar = Number(parameters['CurrentMapVar']);
		    CurrentFloor = $gameVariables.value(CurrentMapVar);
		    if (CurrentFloor == 1) HealingChest = 100;		    
			var rolling = Math.floor((Math.random() * 100) + 1);
			if (rolling <= ItemChest) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'A'], true); }
			else if (rolling <= CrystalChest) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'B'], true); }
			else if (rolling <= HealingChest) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'C'], true); }
			else { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'D'], true); }
		}

		if (command == 'RollItem') {
		   // ShowDatabase();
		    var rarity = GetRarity();
		    if (CommonLoot[rarity]) {
		        var finalResult = Math.floor((Math.random() * CommonLoot[rarity].length))
		        //console.log("Item Rolled: " + CommonLoot[rarity][finalResult] + " Roll: " + finalResult);
		        var ItemName = CommonLoot[rarity][finalResult];
		        receiveItems(ItemName);
		    }
		    }

		if (command == 'RollCrystal') {
		    var rarity = GetRarity();
		}
		if (command == 'RollEpicItem') {
		    var rarity = GetRarity();
		    if (CurrentFloor == 2 && rarity == 1) rarity = 2; 
		    //ShowRareDatabase();
		    if (RareLoot[rarity]) {
		        var finalResult = Math.floor((Math.random() * RareLoot[rarity].length))
		       // console.log("Item Rolled: " + RareLoot[rarity][finalResult] + " Roll: " + finalResult);
		        var ItemName = RareLoot[rarity][finalResult];
		        receiveItems(ItemName);
		    }
		}
	};


	function receiveItems(ItemName) {

	    for (var i = 0; i < $dataItems.length; i++) {
	        if ($dataItems[i]) {
	            var item = $dataItems[i];
	            if (item.name.length > 0 && item.name === ItemName) {
	                $gameParty.gainItem($dataItems[item.id], 1);
	                //console.log("Item obtained " + item.name);
	                $gameInterp.pluginCommand('GabText', "\ii[" + item.id + "] has been obtained. " + item.name);
	                $gameInterp.pluginCommand('ShowGab');
	                return 0;
	            }
	        }
	    }


	    for (var i=0; i<$dataWeapons.length; i++){
	        if ($dataWeapons[i]) {
	            var item = $dataWeapons[i];
	            if (item.name.length > 0 && item.name === ItemName) {
	                $gameParty.gainItem($dataWeapons[item.id], 1);
	                //console.log("Weapon obtained " + item.name);
	                $gameInterp.pluginCommand('GabText', "\iw[" + item.id + "] has been obtained. " + item.name);
	                $gameInterp.pluginCommand('ShowGab');
	                return 0;
	            }
	        }
	    }


	    for (var i = 0; i < $dataArmors.length; i++) {
	        if ($dataArmors[i]) {
	            var item = $dataArmors[i];
	            if (item.name.length > 0 && item.name === ItemName) {
	                $gameParty.gainItem($dataArmors[item.id], 1);
	                //console.log("Armor obtained " + item.name);
	                $gameInterp.pluginCommand('GabText', "\ia[" + item.id + "] has been obtained. "+item.name);
	                $gameInterp.pluginCommand('ShowGab');
	                return 0;
	            }
	        }
	    }  

	}

	function FillDatabase() {
       
	    var regexCommonItem = /<Common Item Level:(\s*\d+\s*)>/gi;
	    var regexRareItem = /<Rare Item Level:(\s*\d+\s*)>/gi;
        var PullOut =/.*(\d+).*/;

	    $dataItems.forEach(function (item) {
	        if (item && item.name.length > 0 ) {
	            var match = item.note.match(regexCommonItem);
	            var matchRare = item.note.match(regexRareItem);
	            if (match) {
	                for (var i = 0; i < match.length; i++) {
	                    var actMatch = match[i].match(PullOut);
	                 //   console.log("actual " + actMatch);
	                 //   console.log("match length " + match.length);
	                 //   console.log("match result: " + match[0] + " and " + match[1]);
	                    if (!CommonLoot[Number(actMatch[1])]) {
	                        var initValues = [];
	                        CommonLoot[Number(actMatch[1])] = initValues;
	                    }
	                    var NewItmPos = CommonLoot[Number(actMatch[1])].length;
	                    CommonLoot[Number(actMatch[1])][NewItmPos] = item.name;
	                }
	            }

	            if (matchRare) {
	                for (var i = 0; i < matchRare.length; i++) {
	                    var actMatch = matchRare[i].match(PullOut);
	                    if (!RareLoot[Number(actMatch[1])]) {
	                        var initValues = [];
	                        RareLoot[Number(actMatch[1])] = initValues;
	                    }
	                    var NewItmPos = RareLoot[Number(actMatch[1])].length;
	                    RareLoot[Number(actMatch[1])][NewItmPos] = item.name;
	                }
	            }
	        }
	    }, this);

	    $dataWeapons.forEach(function (item) {
	        if (item && item.name.length > 0) {
	            var match = item.note.match(regexCommonItem);
	            var matchRare = item.note.match(regexRareItem);
	            if (match) {
	                for (var i = 0; i < match.length; i++) {
	                    var actMatch = match[i].match(PullOut);
	                    if (!CommonLoot[Number(actMatch[1])]) {
	                        var initValues = [];
	                        CommonLoot[Number(actMatch[1])] = initValues;
	                    }
	                    var NewItmPos = CommonLoot[Number(actMatch[1])].length;
	                    CommonLoot[Number(actMatch[1])][NewItmPos] = item.name;
	                }
	            }

	            if (matchRare) {
	                for (var i = 0; i < matchRare.length; i++) {
	                    var actMatch = matchRare[i].match(PullOut);
	                    if (!RareLoot[Number(actMatch[1])]) {
	                        var initValues = [];
	                        RareLoot[Number(actMatch[1])] = initValues;
	                    }
	                    var NewItmPos = RareLoot[Number(actMatch[1])].length;
	                    RareLoot[Number(actMatch[1])][NewItmPos] = item.name;
	                }
	            }
	        }
	    }, this);

	 
	    $dataArmors.forEach(function (item) {
	        if (item && item.name.length > 0) {
	            var match = item.note.match(regexCommonItem);
	            var matchRare = item.note.match(regexRareItem);
	            if (match) {
	                for (var i = 0; i < match.length; i++) {
	                    var actMatch = match[i].match(PullOut);
	                    if (!CommonLoot[Number(actMatch[1])]) {
	                        var initValues = [];
	                        CommonLoot[Number(actMatch[1])] = initValues;
	                    }
	                    var NewItmPos = CommonLoot[Number(actMatch[1])].length;
	                    CommonLoot[Number(actMatch[1])][NewItmPos] = item.name;
	                }
	            }

	            if (matchRare) {
	                for (var i = 0; i < matchRare.length; i++) {
	                    var actMatch = matchRare[i].match(PullOut);
	                    if (!RareLoot[Number(actMatch[1])]) {
	                        var initValues = [];
	                        RareLoot[Number(actMatch[1])] = initValues;
	                    }
	                    var NewItmPos = RareLoot[Number(actMatch[1])].length;
	                    RareLoot[Number(actMatch[1])][NewItmPos] = item.name;
	                }
	            }
	        }
	    }, this);

        


	}


	function ShowRareDatabase() {
	    console.log("Rare Database: ");
	    for (var i = 0; i < RareLoot.length; i++) {
	        console.log("Floor " + i);
	        if (RareLoot[i]) {
	            for (var j = 0; j < RareLoot[i].length; j++) {
	                console.log("item " + j + " " + RareLoot[i][j]);
	            }
	        }
	    }
	    console.log(" ");
	}

	function ShowDatabase() {
	    console.log("Database: ");
	    for (var i=0; i < CommonLoot.length; i++) {
	        console.log("Floor " + i);
	        if (CommonLoot[i]) {
	            for (var j=0; j < CommonLoot[i].length; j++) {
	                console.log("item " + j + " " + CommonLoot[i][j]);
	            }
	        }
	    }
	    console.log(" ");
	}

	function GetRarity() {
	    var result;
	    var rolling = Math.floor((Math.random() * 100) + 1);
	    var CurrentMapVar = Number(parameters['CurrentMapVar']);
	    var CurrentFloor = $gameVariables.value(CurrentMapVar);
	    if (rolling <= 30) {
	        result = CurrentFloor - 1;
	    } else if (rolling <= 85) { result = CurrentFloor; }
	    else { result = CurrentFloor + 1; }
	    if (result < 1) result = 1;
	    if (result > 15) result = 15;
	    return result;
	}

    
})();


/*
	var NormalLoot = [["Red Crystal", "Padded Cloth", "Padded Boots", "Lovely Hat","Trinket 1"],
    ["Hatchet", "Hide Wrappings", "Boots 2", "Hat 2", "Trinket 2"],
    ["Shortsword", "Leather Armor", "Boots 3", "Hat 3", "Trinket 3"],
    ["Spear", "Studded Leather", "Boots 4", "Hat 4", "Trinket 4"],
    ["Mace", "Silk Armor", "Boots 5", "Hat 5", "Trinket 5"],
    ["Longsword", "Gambeson", "Boots 6", "Hat 6", "Trinket 6"],
    ["Handaxe", "Ring Mail", "Boots 7", "Hat 7", "Trinket 7"],
    ["Gladius", "Chain Mail", "Boots 8", "Hat 8", "Trinket 8"],
    ["Halberd", "Brigandine", "Boots 9", "Hat 9", "Trinket 9"],
    ["Kukri", "Rivet Chain", "Boots 10", "Hat 10", "Trinket 10"],
    ["Battleaxe", "Bronze Lamellar","Boots 11", "Hat 11", "Trinket 11"],
    ["Greatsword", "Breastplate", "Boots 12", "Hat 12", "Trinket 12"],
    ["Warhammer", "Half Plate", "Boots 13", "Hat 13", "Trinket 13"],
    ["Naginata", "Full Plate", "Boots 14", "Hat 14", "Trinket 14"],
    ["Katana", "Scale Mail", "Boots 15", "Hat 15", "Trinket 15"]
	];
*/