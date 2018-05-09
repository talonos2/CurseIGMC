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
*@default 20
*
*@param ManaMultiplier
*@desc The amount you multiply each level with for Mana gained
*@default 20
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
*Plugin Command DistanceToPlayer
*checks the distance to the player. If within x units, goes to self variable A
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
		    var amount =9* Math.pow((rarity + 3) / 4, 2);
		    amount = Math.round(amount)+2;
		    var CrystalType = Math.floor((Math.random() * 4) + 10);
		    if (CrystalType != 13) CrystalType = Math.floor((Math.random() * 4) + 10);
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
		    var healing = 20+ rarity * HealingParam;
		    $gameParty.members()[0].gainHp(Number(healing));
		}

		if (command == 'GainMana') {
		    var rarity = GetRarity();
		    var ManaParam = Number(parameters['ManaMultiplier']);
		    var ManaGained = 20+rarity * ManaParam;
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
		    $gameParty.members()[0].gainHp(400);
		    $gameParty.members()[0].gainMp(400);
		    $gameParty.members()[0].refresh();
		}
        
		if (command == 'DistanceToPlayer') {
		    if ($gameTemp.isStopMapEventMovement()) { return 0;}
		    var thisx = $gameMap._events[this._eventId]._x;
		    var thisy = $gameMap._events[this._eventId]._y;
		    var playerposx = $gamePlayer.x;
		    var playerposy = $gamePlayer.y;
		    var DistX = playerposx - thisx;
		    var DistY = playerposy - thisy;
		    var distF = Math.sqrt(Math.pow(DistX, 2) + Math.pow(DistY, 2));

		    if (distF <= .5) { $gameSelfSwitches.setValue([$gameMap._mapId, this._eventId, 'A'], true); }
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
	   
	    if (itemType == "trinket" && !Item2) ItemInUse = "\\>Found \\ia[" + item.id + "]" + item1Special;
	    if (itemType == "trinket" && Item2) {
	        ItemInUse = "\\>Found   \\ia[" + item.id + "]" + item1Special;
	        ItemInUse += "\n\\>Current \\ia[" + Item2.id + "]" + item2Special;
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

	       // Talonos Code: */
	        
            var difference = (item.params[2] - Item2.params[2]);
	        if (difference >= 1)
	        {
	        	difference = "+"+difference;
	        }

            ItemInUse = "\\>Found   \\iw[" + item.id + "], Attack: " + item.params[2] + "("+colorCodeI1+difference+"\\c[0])" + item1Special;
            ItemInUse += "\n\\>Current \\iw[" + Item2.id + "], Attack: " + Item2.params[2] + item2Special;
        }

        $gameInterp.pluginCommand("StopEventMovement");

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
	            $gameInterp.pluginCommand("AllowEventMovement");
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
	            $gameInterp.pluginCommand("AllowEventMovement");
	            return 0;
	        }	    

	        $gameInterp.pluginCommand('GabText', outputTxt);
	        $gameInterp.pluginCommand('ShowGab');
	        $gameInterp.pluginCommand("AllowEventMovement");
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
	    ShowRareDatabase();
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
	    if (result > 20) result = 20;
	    return result;
	}

	var MonsterFacing = 0;
	var battleEventID = 0;

	function GetMonsterFaceing() { return MonsterFacing; }
	function GetBattleEventID() { return battleEventID;}

	function CalculateMonsterDirection(eventId) {
	    battleEventID = eventId;
	    var MonsterFace=0;	    
	    var thisx = $gameMap._events[eventId]._x;
	    var thisy = $gameMap._events[eventId]._y;
	    var playerposx = $gamePlayer.x;
	    var playerposy = $gamePlayer.y;
	    var DistX = playerposx - thisx;
	    var DistY = playerposy - thisy;
	    if (DistX == -1) MonsterFace = 1;
	    if (DistY == 1) MonsterFace = 0;
	    if (DistX == 1) MonsterFace = 2;
	    if (DistY == -1) MonsterFace = 3;
	    // console.log("EvntX " + thisx + " Evnty " + thisy + " plyrx " + playerposx + " plyry " + playerposy + " disx " + DistX + " disy " + DistY);	  	    
	    MonsterFacing = MonsterFace;
	}


    /*
    *
    *Puts the Timer Array for best Run Times into System so that it can be saved when you save/load
    *
    */
	var _Game_System_prototype_initilize = Game_System.prototype.initialize;
	Game_System.prototype.initialize = function () {
	    _Game_System_prototype_initilize.call(this); // Makes sure to do the stuff that was in the function before 
	    this._BestRunTimesz = [];
	};

    //Getters and Setters for retreiving the BestRunTimes array
	Game_System.prototype.GetBestRunTimes = function () {
	    return this._BestRunTimesz;
	};

	Game_System.prototype.SetBestRunTimes = function (runTimer) {
	    this._BestRunTimesz = runTimer;
	};



	function UpdateBestTimes() {
	    
	    var BestRunTimes = [];
	    BestRunTimes = $gameSystem.GetBestRunTimes();  

	    var CurrentMapVar = Number(parameters['CurrentMapVar']);
	    var CurrentFloor = $gameVariables.value(CurrentMapVar);
	    console.log("Current Floor: " + CurrentFloor);
	    //var BestRunTimes = Game_System.BestRunTimesz;

	    var TotalTime = $gameTimer.getFrames();
	    if (BestRunTimes[0] == null || CurrentFloor == 1) BestRunTimes[0] = 36000;
	    var CurrentRunTime = BestRunTimes[0] - TotalTime;
       
	    if (BestRunTimes[CurrentFloor] == null) BestRunTimes[CurrentFloor] = CurrentRunTime;
	    console.log("Previous Best Time " + (BestRunTimes[CurrentFloor] / 60));
	    if (BestRunTimes[CurrentFloor] > CurrentRunTime) {
	        BestRunTimes[CurrentFloor] = CurrentRunTime;
            //implement message update for new best run time
	    }
	    BestRunTimes[0] = TotalTime;
	    console.log("Best RunTime " + (BestRunTimes[CurrentFloor] / 60));

	    $gameSystem.SetBestRunTimes(BestRunTimes);

	}

	Xillith.UpdateBestTimes = UpdateBestTimes;
	Xillith.GetMonsterFaceing = GetMonsterFaceing;
	Xillith.receiveItems = receiveItems;
	Xillith.CalculateMonsterDirection = CalculateMonsterDirection;
	Xillith.ShowDatabase = ShowDatabase;


	


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


    /*
    *This part is to allow the calculation of monster distance to happen every time a battle is started.
    *
    */
	var _Game_Interpreter_prototype_command301 = Game_Interpreter.prototype.command301;
	Game_Interpreter.prototype.command301 = function () {
	    _Game_Interpreter_prototype_command301.call(this);
	    Xillith.CalculateMonsterDirection(this._eventId);
	    return true;
	}

    /*
    *
    *Re-write of the snap for background to hide player/monster in question update the spriteset, then unhide player/monster
    *
    */
	var Scene_Map_prototype_snapForBattleBackground = Scene_Map.prototype.snapForBattleBackground;
	Scene_Map.prototype.snapForBattleBackground = function () {
	    $gamePlayer.setTransparent(true);
	    $gameMap._events[battleEventID].setTransparent(true);
	   
	    this.children.forEach(function (child) {
	        if (child.update) {
	            if (child instanceof Spriteset_Map) { child.update(); }
	        }
	    });

	    Scene_Map_prototype_snapForBattleBackground.call(this);
	    $gamePlayer.setTransparent(false);
	    $gameMap._events[battleEventID].setTransparent(false);
	}


})();


