//=============================================================================
// TAL_ImToast.js
//=============================================================================

/*:
 * @plugindesc What have I gotten myself into?
 * @author Talonos
 *
 * @help There IS no help. You are doomed.
 */

//Copied from RPGScenes 635:

Scene_Map.prototype.launchBattle = function() {
    BattleManager.saveBgmAndBgs();
    //this.stopAudioOnBattleStart();
    SoundManager.playBattleStart(); //Plays a sound effect only.
    this.startEncounterEffect();
    this._mapNameWindow.hide();
};

//Kills Sound effects and music effects. Commented out above.
Scene_Map.prototype.stopAudioOnBattleStart = function() {
    if (!AudioManager.isCurrentBgm($gameSystem.battleBgm())) {
        AudioManager.stopBgm();
    }
    AudioManager.stopBgs();
    AudioManager.stopMe();
    AudioManager.stopSe();
};

Scene_Map.prototype.startEncounterEffect = function() {
    this._spriteset.hideCharacters();
    this._encounterEffectDuration = this.encounterEffectSpeed();
};

Scene_Map.prototype.updateEncounterEffect = function() {
    if (this._encounterEffectDuration > 0) {
        this._encounterEffectDuration--;
        var speed = this.encounterEffectSpeed();
        //n: How many have passed.
        var n = speed - this._encounterEffectDuration;
        //p: how long do we have left as %
        var p = n / speed;

        var q = (p - 1);
        var zoomX = $gamePlayer.screenX();
        var zoomY = $gamePlayer.screenY() - 24;
        if (n === 2) {
            //$gameScreen.setZoom(zoomX, zoomY, 1);
            this.snapForBattleBackground();
            this.startFlashForEncounter(12);
        }
        if (n === Math.floor(speed / 2)) {
            BattleManager.playBattleBgm();
            //this.startFadeOut(10);
        }
    }
};

// ???
Scene_Map.prototype.snapForBattleBackground = function() {
    this._windowLayer.visible = false;
    SceneManager.snapForBackground();
    this._windowLayer.visible = true;
};

//Changed
Scene_Map.prototype.startFlashForEncounter = function(duration) {
    var color = [255, 192, 128, 190];
    $gameScreen.startFlash(color, duration);
};

//Changed
Scene_Map.prototype.encounterEffectSpeed = function() {
    return 18;
};

//Changed
Scene_Battle.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    //this.startFadeIn(this.fadeSpeed(), false);
    BattleManager.playBattleBgm();
    BattleManager.startBattle();
};

Sprite_Enemy.prototype.setBattler = function(battler) {
    Sprite_Battler.prototype.setBattler.call(this, battler);
    var changed = (battler !== this._enemy);
    if (changed) {
        this._enemy = battler;
        if (battler) {
            this.setHome(battler.screenX(), battler.screenY());
        }
        this.startEntryMotion();
    	this._stateIconSprite.setup(battler);
    }
};

Sprite_Enemy.prototype.initialize = function(battler) {
    Sprite_Battler.prototype.initialize.call(this, battler);
    this.moveToStartPosition();
    this.setBattler(battler);
};

Sprite_Enemy.prototype.moveToStartPosition = function() {
    //this.startMove(-500, 0, 0);
};

Sprite_Enemy.prototype.startEntryMotion = function() {
    if (this._enemy && this._enemy.canMove()) {
    	this.startMove(-300, 0, 0);
        this.startMove(0, 0, 20);
    } else {
        this.startMove(0, 0, 0);
    }
};

BattleManager.processVictory = function() {
    $gameParty.removeBattleStates();
    $gameParty.performVictory();
    //this.playVictoryMe();
    this.replayBgmAndBgs();
    this.makeRewards();
    //this.displayVictoryMessage();
    //this.displayRewards();
    this.gainRewards();
    this.endBattle(0);
};

//Window_BattleLog.prototype.startTurn = function() {
//};

Scene_Battle.prototype.stop = function() {
    Scene_Base.prototype.stop.call(this);
	this.startFadeOut(10, true);
    this._statusWindow.close();
    this._partyCommandWindow.close();
    this._actorCommandWindow.close();
};

Game_Actor.prototype.makeAutoBattleActions = function() 
{
    if (this.doSkill(5, "up")) {return;}
    this.doBasicAttack();
};

Game_Actor.prototype.doBasicAttack = function() 
{
    var action = new Game_Action(this);
    action.setAttack();
    this.setAction(0, action);
    this.setActionState('waiting');
};

Game_Actor.prototype.doSkill = function(skillNum, key) 
{
    if (Input.isPressed(key)&&this.canUse($dataSkills[skillNum]))
    {
        var action = new Game_Action(this);
        action.setSkill(skillNum);
        this.setAction(0, action);
        this.setActionState('waiting');
        return true;
    }
    return false;
};

//Taken from Yanfly's BEC 1868
BattleManager.endTurn = function() {
    //if (this.isTurnBased() && this._spriteset.isPopupPlaying()) return;
    if (this.isTurnBased() && this._enteredEndPhase) {
      this._phase = 'turnEnd';
      this._preemptive = false;
      this._surprise = false;
      return;
    }
    this._enteredEndPhase = true;
    Yanfly.BEC.BattleManager_endTurn.call(this);
    BattleManager.refreshAllMembers();
};

//Here for reference:
/*
Game_Actor.prototype.makeActionList = function() {
    var list = [];
    var action = new Game_Action(this);
    action.setAttack();
    list.push(action);
    this.usableSkills().forEach(function(skill) {
        action = new Game_Action(this);
        action.setSkill(skill.id);
        list.push(action);
    }, this);
    return list;
};
*/