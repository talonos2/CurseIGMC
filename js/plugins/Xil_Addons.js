/*:
*
*@plugindesc Addon for random chests
*on the map
*
*@author Xillith
*
*
*@param CurrentMapVar
*@desc Variable the current floor is stored at
*@default 1
*
*@param ItemChest
*@desc Chance a common chest will appear
*@default 45
*
*@param CrystalChance
*@desc Chance a Crystal chest will appear
*@default 30
*
*@param HealingChance
*@desc Chance a common chest will appear 
*@default 10
*
*@param ManaChance
*@desc Chance a common chest will appear 
*@default 10
*
*@param GoldChests
*@desc Not actual value. Remainder of 3 above.
*@default 5
*
*@param HealingMultiplier
*@desc The amount you multiply each level with for healing
*@default 15
*
*@param ManaMultiplier
*@desc The amount you multiply each level with for Mana gained
*@default 15
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
*RollCrystal
*Generate random crystal and give it to the player
*
*HealPlayer
*Heal the party
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
var Xillith = {}
console.log(Xillith);

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
                FillDatabaseItm();               
                NoteTagsLoaded = true;
            }
        return true;
        };
    
        

	var _Game_Interprete_pluginCommand=Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function(command, args) {
    // to be overridden by plugins
		_Game_Interprete_pluginCommand.call(this,command,args);

		var CurrentMapVar;
		var CurrentFloor;

		if (command == 'ChestType') {
		    var ItemChest = Number(parameters['ItemChest']);
		    var ManaChest = Number(parameters['ManaChance']);
		    var EpicChest = Number(parameters['GoldChests']);
		    if ($gameVariables.value(3) == 0) {
		        ItemChest += ManaChest;
		        ManaChest = 0;
		    }
		    CurrentMapVar = Number(parameters['CurrentMapVar']);
		    CurrentFloor = $gameVariables.value(CurrentMapVar);
		    if (CurrentFloor == 1) ItemChest+=EpicChest;

		    var CrystalChest = Number(parameters['CrystalChance'])+ItemChest;
		    var HealingChest = Number(parameters['HealingChance']) + CrystalChest;
		    ManaChest = ManaChest + HealingChest;
		   
		    var rolling = Math.floor((Math.random() * 100) + 1);
		    //console.log("Rolled: " + rolling + " Item chance " + ItemChest + " CrystalChance " + CrystalChest + " healing chance" + HealingChest + " Mana chance " + ManaChest);
			if (rolling <= ItemChest) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'A'], true); }
			else if (rolling <= CrystalChest) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'B'], true); }
			else if (rolling <= HealingChest) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'C'], true); }
			else if (rolling <= ManaChest) {this.setSelfSwitchValue($gameMap._mapId, this._eventId, 81, true);}
			else { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'D'], true); }
		}

		

		if (command == 'RollItem') {
		    //ShowDatabase();
		    var rarity = Number(GetRarity());
		  //  console.log("floor " + rarity);
		    if (CommonLoot[rarity]) {
		        var finalResult = Math.floor((Math.random() * CommonLoot[rarity].length))
		        //console.log("Item Rolled: " + CommonLoot[rarity][finalResult] + " Roll: " + finalResult);
		        var ItemName = CommonLoot[rarity][finalResult];
		        receiveItems(ItemName);		      
		        }
		    }

		if (command == 'RollCrystal') {
            //Assuming crystals in slots 10-13
		    var rarity = GetRarity();
		    //((floor+2)/3)^2
		    var amount =10* Math.pow((rarity + 2) / 3, 2);
		    amount = Math.round(amount);
		    var CrystalType = Math.floor((Math.random() * 4) +10);
		    var outputTxt = ["" + amount + " \\ii[" + CrystalType + "] obtained and sent to town."];
		    var CrystalsSoFar = $gameVariables.value(CrystalType);
		    CrystalsSoFar+=amount;
		    $gameVariables.setValue(CrystalType, CrystalsSoFar);
		    $gameInterp.pluginCommand('GabText', outputTxt);
		    $gameInterp.pluginCommand('ShowGab');    
		}

		if (command == 'HealPlayer') {
		    var rarity = GetRarity();
		    var HealingParam = Number(parameters['HealingMultiplier']);
		    var healing = rarity * HealingParam;
		    $gameParty.members()[0].gainHp(Number(healing));
		}

		if (command == 'GainMana') {
		    var rarity = GetRarity();
		    var ManaParam = Number(parameters['ManaMultiplier']);
		    var ManaGained = rarity * ManaParam;
		    $gameParty.members()[0].gainMp(Number(ManaGained));
		}

		if (command == 'RollEpicItem') {
		    var CurrentMapVar = Number(parameters['CurrentMapVar']);
		    var CurrentFloor = $gameVariables.value(CurrentMapVar);
		    var rarity = Number(GetRarity());
		    if (CurrentFloor == 2 && rarity == 1) rarity = 2; 
		   // ShowRareDatabase();
		    if (RareLoot[rarity]) { 
		        var finalResult = Math.floor(( Math.random() * RareLoot[rarity].length ));		     
		        var ItemName = RareLoot[rarity][finalResult];
		        receiveItems(ItemName);
		    }
		}

		if (command == 'SetCrystalBuffs') {
		    var atk = $gameVariables.value(8);
		    var def = $gameVariables.value(6);
		    var hp = $gameVariables.value(7);
		    var mana = $gameVariables.value(9);
		    //console.log("who " + $gameParty.members()[0].name + " atk " + atk + " def " + def + " hp " + hp + " mana " + mana);
		    $gameParty.members()[0]._paramPlus[0] += hp;
		    $gameParty.members()[0]._paramPlus[1] += mana;
		    $gameParty.members()[0]._paramPlus[2] += atk;
		    $gameParty.members()[0]._paramPlus[3] += def;
		    $gameParty.members()[0].gainHp(140);
		    $gameParty.members()[0].gainMp(140);
		    $gameParty.members()[0].refresh();
		}

	};


	function receiveItems(ItemName) {

	    for (var i = 0; i < $dataItems.length; i++) {
	        if ($dataItems[i]) {
	            var item = $dataItems[i];
	            if (item.name.length > 0 && item.name === ItemName) {
	                //console.log("which item found: " + ItemName);
	                ChooseEquip(item, "item");
	                return 0;
	            }
	        }
	    }

	    for (var i=0; i<$dataWeapons.length; i++){
	        if ($dataWeapons[i]) {
	            var item = $dataWeapons[i];
	            if (item.name.length > 0 && item.name === ItemName) {
	                //console.log("which item found: " + ItemName);
	                ChooseEquip(item, "weapon");
	                return 0;
	            }
	        }
	    }

	    for (var i = 0; i < $dataArmors.length; i++) {
	        if ($dataArmors[i]) {
	            var item = $dataArmors[i];
	            if (item.name.length > 0 && item.name === ItemName) {
	                //console.log("which item found: " + ItemName);
	                if (item.etypeId == 3) ChooseEquip(item, "armor");                  
	                if (item.etypeId == 4) ChooseEquip(item, "trinket");
	                return 0;
	            }
	        }
	    }  

	}

	function ChooseEquip(item, itemType) {

	    //console.log("item name: " + item.name + " etypeID " + item.etypeId + " itemType "+itemType);

	    var ItemInUse="";
	    var Item2 = null;
	        Item2 = getEquipOfType($gameParty.members()[0], item.etypeId);
	    var colorCodeI1;
	    var colorCodeI2;
	    var outputTxt = "";
	    var item1Special = "";
	    var item2Special = "";
	    var regexSpecials = /<Specials:\s*(.*)\s*>/i;
	    var matchItem1 = item.note.match(regexSpecials);
	    var matchItem2=null;
	        if (Item2) matchItem2 = Item2.note.match(regexSpecials);
	    if (matchItem1) { item1Special= "; Special: "+matchItem1[1]; }
	    if (matchItem2) { item2Special = "; Special: " + matchItem2[1]; }

	    if (itemType == "item") {
	        SendToTown(item, itemType);
	        return 0;
	    }
	   
	    if (itemType == "trinket" && !Item2) ItemInUse = "\\>Found \\ia[" + item.id + "]; " + item1Special;
	    if (itemType == "trinket" && Item2) {
	        ItemInUse = "\\>Found   \\ia[" + item.id + "]; " + item1Special;
	        ItemInUse += "\n\\>Current \\ia[" + Item2.id + "]; " + item2Special;
	    }

	    if (itemType == "armor" && !Item2) ItemInUse = "\\>Found \\ia[" + item.id + "]; " + item1Special;
	    if (itemType == "armor" && Item2) {
	        if (Item2.params[3] > item.params[3]) {
	            colorCodeI1 = "\\c[18]";
	            colorCodeI2 = "\\c[3]";
	        }
	        else if (Item2.params[3] < item.params[3]) {
	            colorCodeI1 = "\\c[3]";
	            colorCodeI2 = "\\c[18]";
	        }
	        else {
	            SendToTown(item, itemType);
	            return 0;
	        }

	        var difference = (item.params[3] - Item2.params[3]);
	        if (difference >= 1) {
	            difference = "+" + difference;
	        }

	        ItemInUse = "\\>Found   \\ia[" + item.id + "], Defense: " + item.params[3] + "(" + colorCodeI1 + difference + "\\c[0])" + item1Special;
	        ItemInUse += "\n\\>Current \\ia[" + Item2.id + "], Defense: " + Item2.params[3] + item2Special;

	//        ItemInUse = /*"\\>Received: \\ia[" + item.id + "]. Would you like to equip it?\n" +*/
      //          "\\>Found   \\ia[" + item.id + "]: Defense: +" + colorCodeI1 + item.params[3] + "\\c[0]" + item1Special;
	    //    ItemInUse += "\n\\>Current " + "\\ia[" + Item2.id + "]: Defense: +" + colorCodeI2 + Item2.params[3] + "\\c[0]" + item2Special;

	    }
	   // else { do you want to equip it?}

	    if (itemType == "weapon" && !Item2) ItemInUse = "\\>Found \\iw[" + item.id + "]; " + item1Special;
        if (itemType == "weapon" && Item2) {            
          //  Item2 = $gameParty.members()[0].equips()[item.etypeId - 1];
            if (Item2.params[2] > item.params[2])
            {
                colorCodeI1 = "\\c[18]";
                colorCodeI2 = "\\c[3]";
            }
            else if (Item2.params[2] < item.params[2]) {
                colorCodeI1 = "\\c[3]";
                colorCodeI2 = "\\c[18]";
            }
            else {
                SendToTown(item,itemType);
                return 0;
            }

            /** Old Xillith Code

            ItemInUse = "\\>Received: \\iw[" + item.id + "]. Would you like to equip it?\n" +
                "\\>Found   \\iw[" + item.id + "]: Attack: +" + colorCodeI1 + item.params[2] + "\\c[0]" + item1Special;
            //if (item.description != "") ItemInUse = ItemInUse + " Special: " + item.description;
            ItemInUse += "\n\\>Current \\iw[" + Item2.id + "]: Attack: +" + colorCodeI2 + Item2.params[2] + "\\c[0]" + item2Special;
            //if (Item2.description != "") ItemInUse = ItemInUse + " Special: " + Item2.description;
            //    ItemInUse=ItemInUse+"\n" + "\\>\\}Warning: Currently equipped items lost upon death.";
	        //$gameParty.members()[0]

	        Talonos Code: */
	        
            var difference = (item.params[2] - Item2.params[2]);
	        if (difference >= 1)
	        {
	        	difference = "+"+difference;
	        }

            ItemInUse = "\\>Found   \\iw[" + item.id + "], Attack: " + item.params[2] + "("+colorCodeI1+difference+"\\c[0])" + item1Special;
            ItemInUse += "\n\\>Current \\iw[" + Item2.id + "], Attack: " + Item2.params[2] + item2Special;
        }

	    $gameMessage.setBackground(1);
	    $gameMessage.setPositionType(1);
	    $gameMessage.add(ItemInUse);

	    iTypeChar = (itemType == "weapon" ? "w" : "a");

	    choices = []; params = [];
	    $gameMessage.setChoices(choices, 1, 1);
	    choices.push("Equip \\n"+iTypeChar+"["+item.id+"]"); choices.push("Send \\n"+iTypeChar+"["+item.id+"] Home");
	    params.push();
	    $gameMessage.setChoiceCallback(function (n) {
  
	        if (n==1) {
	            SendToTown(item, itemType);
	            return 0;
	        }
	        if (n == 0) {
	            if (Item2) {
	            	//Equip the Item
	                equipAThing($gameParty.members()[0],item)
	                SendToTown(Item2, itemType);
	                outputTxt = ["\\i"+iTypeChar+"[" + item.id + "] equipped."];
	            }
	            else 
	            {
	                equipAThing($gameParty.members()[0],item)
	                outputTxt = ["\\i"+iTypeChar+"[" + item.id + "] equipped."];
	            }
	        }

	        if (itemType == "item" ) {
	            SendToTown(item, itemType);
	            return 0;
	        }	    

	        $gameInterp.pluginCommand('GabText', outputTxt);
	        $gameInterp.pluginCommand('ShowGab');


	        return n;
	    }.bind(this));

	}

	equipAThing = function(actor, item) 
	{
		//Bail out if no actor.
	    if (!actor) {console.log("No actor found!"); return;}
		//Save HP
	    var savedHPRate = actor.hpRate()
	    var savedMPRate = actor.mpRate()
	    //Actually do the equipping
    	var index = actor.equipSlots().indexOf(item.etypeId);
    	actor._equips[index].setObject(item);
	    //Scale HP proportionately.
	    actor.refresh()
	    actor._hp = Math.round(actor.mhp*savedHPRate);
	    actor._mp = Math.round(actor.mmp*savedMPRate);
    	return true;
	};

	getEquipOfType = function(actor, etypeId)
	{
		var index = actor.equipSlots().indexOf(etypeId);
		return actor.equips()[index];
	}


	function SendToTown(item, itemType) {

	   // console.log("sending to town + " + itemType);

	    var outputTxt="";
	    if (itemType == "armor"|| itemType=="trinket") {
	        $gameParty.gainItem($dataArmors[item.id], 1);
	        outputTxt = ["\\ia[" + item.id + "] sent to town."];
	    }

	    if (itemType == "weapon") {
	        $gameParty.gainItem($dataWeapons[item.id], 1);
	        outputTxt = ["\\iw[" + item.id + "] sent to town."];
	    }

	    if (itemType == "item") {
	        $gameParty.gainItem($dataItems[item.id], 1);
	        outputTxt = ["\\ii[" + item.id + "] sent to town."];
	    }

	    $gameInterp.pluginCommand('GabText', outputTxt);
	    $gameInterp.pluginCommand('ShowGab');


	}



	function FillDatabaseItm() {
       
	    var regexCommonItem = /<Common Item Level:\s*(\d+)\s*>/gi;
	    var regexRareItem = /<Rare Item Level:\s*(\d+)\s*>/gi;
	    var PullOutC = /<Common Item Level:\s*(\d+)\s*>/i;
	    var PullOutE = /<Rare Item Level:\s*(\d+)\s*>/i;

	    $dataItems.forEach(function (item) {
	        if (item && item.name.length > 0 ) {
	            var match = item.note.match(regexCommonItem);
	            var matchRare = item.note.match(regexRareItem);
	            if (match) {
	                for (var i = 0; i < match.length; i++) {
	                    var actMatch = match[i].match(PullOutC);
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
	                    var actMatch = matchRare[i].match(PullOutE);
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

	                    var actMatch = match[i].match(PullOutC);
	                 //   console.log("match result: " + match[0] + " and " + match[1] );
	                 //   console.log("actual " + actMatch[0] + " and " + actMatch[1]);
	                  //  console.log(" ");
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
	                    var actMatch = matchRare[i].match(PullOutE);
	                //    console.log("match result: " + matchRare[0] + " and " + matchRare[1] );
	                //    console.log("pullout " + actMatch[0]+ " and " +actMatch[1]);
	               //     console.log (" ");
	                    
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
	                    var actMatch = match[i].match(PullOutC);
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
	                    var actMatch = matchRare[i].match(PullOutE);
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

	Xillith.receiveItems = receiveItems;

    /*
    *Section for Managing the End of a Battle
    */

	var _BattleManager_processDefeat = BattleManager.processDefeat;
	BattleManager.processDefeat = function () {
	   // console.log("hmm");
	   // _BattleManager_processDefeat.call(this);

	    //this.displayDefeatMessage();
	    this.playDefeatMe();
	    if (this._canLose) {
	        this.replayBgmAndBgs();
	    } else {
	        AudioManager.stopBgm();
	    }	    
	    this.endBattle(2);
	    //$gameTemp.reserveCommonEvent(10);
	};
    
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