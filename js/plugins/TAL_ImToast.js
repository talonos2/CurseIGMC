//=============================================================================
// TAL_ImToast.js
//=============================================================================

/*:
 * @plugindesc What have I gotten myself into?
 * @author Talonos
 *
 * @help There IS no help. You are doomed.
 */


// PLEASE don't look at this code! It will not help you, I promise! I had
// so little time, it was a game jam, I'm gonna cry, I'm sorry. :( :( :(
 var Talonos = {}
 Talonos.unsungLevels = 0;

//Copied from RPGScenes 635:

Scene_Map.prototype.launchBattle = function() {
    BattleManager.saveBgmAndBgs();
    //this.stopAudioOnBattleStart();
    SoundManager.playBattleStart(); //Plays a sound effect only.
    this.startEncounterEffect();
    this._mapNameWindow.hide();
};

BattleManager.playBattleBgm = function() 
{
    console.log("Now playing: MUSIC!")
    AudioManager.fadeInOverlay(.1);
};

BattleManager.replayBgmAndBgs = function() 
{
    AudioManager.fadeOutOverlay(1)
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
    BattleManager.playBattleBgm();
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
            //BattleManager.playBattleBgm();
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
    BattleManager.startBattle();
    this._statusWindow.visible = false
    $gamePlayer.setStealthMode(false);
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
	//this.startFadeOut(10, true);
    this._statusWindow.close();
    this._partyCommandWindow.close();
    this._actorCommandWindow.close();
};

Game_Actor.prototype.makeAutoBattleActions = function() 
{
    //if (this.doSkill(5, "up")) {return;}
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

//Used by some action sequences.

Input._pressedTimeMap = {};

Input.wasPressedRecently = function(keyName, defOfRecently) 
{
    var timeSincePressed = SceneManager._getTimeInMs()-this._pressedTimeMap[keyName];
    return (timeSincePressed <= defOfRecently);
};

Input.update = function() 
{
    this._pollGamepads();
    if (this._currentState[this._latestButton]) {
        this._pressedTime++;
    } else {
        this._latestButton = null;
    }
    //iterate over all held keys, check if previously unheld, set time held to 1;
    for (var name in this._currentState) 
    {
        if (this._currentState[name] && !this._previousState[name]) 
        {
            this._pressedTimeMap[name] = SceneManager._getTimeInMs();
            this._latestButton = name;
            this._pressedTime = 0;
            this._date = Date.now();
        }
        this._previousState[name] = this._currentState[name];
    }
    this._updateDirection();
};

//Gain HP on Level up.

Game_Actor.prototype.changeExp = function(exp, show) {
    this._exp[this._classId] = Math.max(exp, 0);
    var oldMHP = this.mhp;
    var oldMMP = this.mmp;
    var lastLevel = this._level;
    var lastSkills = this.skills();
    while (!this.isMaxLevel() && this.currentExp() >= this.nextLevelExp()) {
        this.levelUp();
        //This line used to make level up popups appear.
        Talonos.unsungLevels ++;
    }
    while (this.currentExp() < this.currentLevelExp()) {
        this.levelDown();
    }
    // NUKED: No level up screen.
    //if (show && this._level > lastLevel) {
    //    this.displayLevelUp(this.findNewSkills(lastSkills));
    //}
    this.refresh();
    this._hp += (this.mhp-oldMHP);
    this._mp += (this.mmp-oldMMP);
};

//Change Speed

Game_Player.prototype.distancePerFrame = function() 
{
    if (this.isStealthMode())
    {
        return 16/256; //1x speed, mutually exclusive with haste and dashing.
    }
    if (this.moveSpeed()===6)
    {
        return 192/256; //12x speed
    }
    return 24/256 + (this.isDashing()?24/256:0); //1.5x speed, or 3x when dashing.
};

//Do passive HP/MP Regen

Talonos.Game_Timer_Update = Game_Timer.prototype.update

Talonos.StealthModeCost = 10; //Cost is in mana per second
Talonos.HasteCost = 15; //Cost is in mana per second

Game_Timer.prototype.update = function(sceneActive) 
{
    Talonos.Game_Timer_Update.apply(this, arguments);
    var framesPerHpRegen = Math.round((36000/2)/$gameParty.allMembers()[0].mhp);
    var framesPerMpRegen = Math.round((36000/2)/$gameParty.allMembers()[0].mmp);
    if (this.getFrames()%framesPerHpRegen === 0)
    {
        $gameParty.allMembers()[0].gainHp(1);
    }
    if (this.getFrames()%framesPerMpRegen === 0)
    {
        $gameParty.allMembers()[0].gainMp(1);
    }

    //If stealth mode is on, lower mana by some amount
    var framesPerStealthManaDrainTick = Math.round(60/Talonos.StealthModeCost);
    if ($gamePlayer.isStealthMode() && this.getFrames()%framesPerStealthManaDrainTick === 0)
    {
        $gameParty.allMembers()[0].gainMp(-1);
        if ($gameParty.allMembers()[0].mp<=0) 
        {
            $gamePlayer.setStealthMode(false);
        }
    }

    //If haste mode is on, lower mana by some amount
    var framesPerHasteManaDrainTick = Math.round(60/Talonos.HasteCost);
    if ($gamePlayer.dashSpellOn && this.getFrames()%framesPerStealthManaDrainTick === 0)
    {
        $gameParty.allMembers()[0].gainMp(-1);
        if ($gameParty.allMembers()[0].mp<=0) 
        {
            $gamePlayer.dashSpellOn = false;
        }
    }

    //Also play level up effects if warranted.

    if (SceneManager._scene.constructor === Scene_Map && this.getFrames()%45 === 0 && Talonos.unsungLevels > 0)
    {
        Talonos.unsungLevels -= 1;
        $gamePlayer.requestAnimation (137);
    }
};

//Can only dash with some elemental power active. (Currently Element 3, switch 64)
Game_Map.prototype.isDashDisabled = function() 
{
    return true;//$dataMap.disableDashing || !$gameSwitches.value(64);
};

Scene_Map.prototype.isMenuEnabled = function() 
{
    return !$gameMap.isEventRunning();
};

Scene_Map.prototype.callMenu = function() {
    SoundManager.playOk();
    if ($gameSystem.isMenuEnabled())
    {
        SceneManager.push(Scene_Menu);
    }
    else
    {
        SceneManager.push(Scene_Options);
    }
    Window_MenuCommand.initCommandPosition();
    $gameTemp.clearDestination();
    this._mapNameWindow.hide();
    this._waitCount = 2;
};

Window_Options.prototype.makeCommandList = function() 
{
    this.addGeneralOptions();
    this.addVolumeOptions();
    this.addCommand(TextManager.toTitle, 'toTitle');
};

Scene_Options.prototype.createOptionsWindow = function() {
    this._optionsWindow = new Window_Options();
    this._optionsWindow.setHandler('toTitle',  this.commandToTitle.bind(this));
    this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._optionsWindow);
};

Scene_Options.prototype.commandToTitle = function() {
    this.fadeOutAll();
    SceneManager.goto(Scene_Title);
};

Window_Options.prototype.statusText = function(index) {
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (this.isExitSymbol(symbol))
    {
        return "";
    }
    if (this.isVolumeSymbol(symbol)) 
    {
        return this.volumeStatusText(value);
    } 
    else 
    {
        return this.booleanStatusText(value);
    }
};

Window_Options.prototype.isExitSymbol = function(symbol) 
{
    return symbol.contains('Title');
};

Window_Options.prototype.processOk = function() {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (this.isExitSymbol(symbol))
    {
        //What the crap am I even doing.
        SceneManager._scene.commandToTitle();
    }
    if (this.isVolumeSymbol(symbol)) {
        value += this.volumeOffset();
        if (value > 100) {
            value = 0;
        }
        value = value.clamp(0, 100);
        this.changeValue(symbol, value);
    } else {
        this.changeValue(symbol, !value);
    }
};

Game_Player.prototype.isDashing = function() 
{
    return this.dashSpellOn;
};

AudioManager._overlayBuffer = null;

AudioManager.silentlyPlayOverlay = function(overlay, pos) 
{
    if (overlay.name) 
    { 
        this._overlayBuffer = this.createBuffer('bgm', overlay.name);
        this.updateOverlayParameters(overlay);
        this._overlayBuffer.play(true, pos || 0);
        AudioManager._overlayBuffer.fadeOut(.01);
    }
};

AudioManager.fadeInOverlay = function(duration) 
{
    if (this._overlayBuffer) 
    { 
        AudioManager._overlayBuffer.stop();
        this._overlayBuffer.play(true, 0 || 0);
        AudioManager.syncOverlayToMusic();
        AudioManager._overlayBuffer.fadeIn(duration);
    }
};

AudioManager.fadeOutOverlay = function(duration) 
{
    if (this._overlayBuffer) 
    { 
        AudioManager._overlayBuffer.fadeOut(duration);
    }
};

AudioManager.syncOverlayToMusic = function()
{
    AudioManager._overlayBuffer.play(true, AudioManager._bgmBuffer.seek())
}

AudioManager.updateOverlayParameters = function(overlay) 
{
    this.updateBufferParameters(this._overlayBuffer, this._bgmVolume, overlay);
};

Talonos.crystalTiers = [100,350,850,1600,2600,3850,5100,6350,8100,10100]
Talonos.crystalUpgrades = [100,250,500,750,1000,1250,1250,1250,1750,2000]
Talonos.crystalTiers[-1] = 0;       //lol javascript
Talonos.crystalUpgrades[-1] = 0;

//Overrides Yanfly's stuff at YEP_EquipCore 817
Window_StatCompare.prototype.refresh = function() {
    this.contents.clear();
    if (!this._actor) return;
    for (var i = 0; i < 4; ++i) {
        this.drawItem(0, this.lineHeight() * i, i);
    }
};