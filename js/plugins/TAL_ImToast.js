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
// so little time, it was a game jam etc...
 var Talonos = {}
 Talonos.unsungLevels = 0;
 Talonos.ADJUST_BATTLE_Y = 70;
 Talonos.ADJUST_BATTLE_X = 32;
 Talonos.storedPlayerScreenPositionX = 0;
 Talonos.storedPlayerScreenPositionY = 0;

//Copied from RPGScenes 635:

Scene_Map.prototype.launchBattle = function() {
    BattleManager.saveBgmAndBgs();
    $gameScreen.setZoom(4, 4, 1);
    //this.stopAudioOnBattleStart();
    SoundManager.playBattleStart(); //Plays a sound effect only.
    this.startEncounterEffect();
    this._mapNameWindow.hide();
};

BattleManager.playBattleBgm = function() 
{
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
    //this._spriteset.hideCharacters(); //Removed so we can see the chars as we zoom in.
    this._encounterEffectDuration = this.encounterEffectSpeed();

    //Save player position so we can use it in the battle screen.
    Talonos.storedPlayerScreenPositionX = $gamePlayer.screenX();
    Talonos.storedPlayerScreenPositionY = $gamePlayer.screenY()+6;

};

Scene_Map.prototype.updateEncounterEffect = function() {
    if (this._encounterEffectDuration > 0) {
        this._encounterEffectDuration--;
        var lengthOfEffect = this.encounterEffectSpeed();
        var framesPassed = lengthOfEffect - this._encounterEffectDuration;
        if (framesPassed === lengthOfEffect) {
            $gameScreen.hideAllPictures();
            this.snapForBattleBackground();
            $gameScreen.unhideAllPictures();
        }
    }
};

Game_Screen.prototype.hideAllPictures = function() {
    this._pictures.forEach(function(picture) {
        if (picture) {
            picture._opacity = 1;
        }
    });
};

Game_Screen.prototype.unhideAllPictures = function() {
    this._pictures.forEach(function(picture) {
        if (picture) {
            picture._opacity = 255;
        }
    });
};

Scene_Map.prototype.updateMain = function() {
    var active = this.isActive();
    $gameMap.update(active);
    $gamePlayer.update(active);
    $gameTimer.update(active);
    $gameScreen.update();
};

//Changed
Scene_Map.prototype.startFlashForEncounter = function(duration) {
    var color = [255, 192, 128, 190];
    $gameScreen.startFlash(color, duration);
};

//Deprecated: used in old encounter transition
Scene_Map.prototype.oldEncounterEffectSpeed = function() {
    return 18;
};

//Changed
Scene_Map.prototype.encounterEffectSpeed = function() {
    return 5;
};

//Changed
Scene_Battle.prototype.start = function() {
    Scene_Base.prototype.start.call(this);
    //this.startFadeIn(this.fadeSpeed(), false);
    BattleManager.startBattle();
    $gamePlayer.setStealthMode(false);
    $gamePlayer.dashSpellOn = false;
    $gameSwitches.setValue(91,false);
};

//SPRITE ACTIOR

Sprite_Actor.prototype.setBattler = function(battler) {
    Sprite_Battler.prototype.setBattler.call(this, battler);
    var changed = (battler !== this._actor);
    if (changed) {
        this._actor = battler;
        if (battler) {
            this.updateBitmapToSpecific()
            this.setActorHome(battler.index());
        }
        this.startEntryMotion();
        this._stateSprite.setup(battler);
    }
};

Sprite_Actor.prototype.updateBitmapToSpecific = function() {
    Sprite_Battler.prototype.updateBitmap.call(this);
    var name = this._actor.battlerName();
    if (name.indexOf('ms_') > -1)
    {
        this._battlerName = name;
        if (Xillith.GetMonsterFaceing()==0){name+="2"}
        if (Xillith.GetMonsterFaceing()==1){name+="0"}
        if (Xillith.GetMonsterFaceing()==2){name+="2"}
        if (Xillith.GetMonsterFaceing()==3){name+="0"}
        this._mainSprite.bitmap = ImageManager.loadSvActor(name);
    }
};

Sprite_Actor.prototype.setActorHome = function(index) {
    //Only one guy.
    var homex = Talonos.storedPlayerScreenPositionX;
    var homey = Talonos.storedPlayerScreenPositionY;
    //But that's the position the player is at on the map; the STARTING position. Now, we need to move the players's home to where he FIGHTS from.
    if (Xillith.GetMonsterFaceing()==1){homex+=Talonos.mapSyncPosition;homey-=Talonos.mapSyncPosition}
    if (Xillith.GetMonsterFaceing()==2){homex-=Talonos.mapSyncPosition;homey+=Talonos.mapSyncPosition}
    if (Xillith.GetMonsterFaceing()==0){homex+=Talonos.mapSyncPosition;homey-=Talonos.mapSyncPosition}
    if (Xillith.GetMonsterFaceing()==3){homex-=Talonos.mapSyncPosition;homey+=Talonos.mapSyncPosition}
    this.setHome(homex, homey);
};

//Overwritten to reduce file size of SV Battler
Sprite_Actor.prototype.updateFrame = function() {
    Sprite_Battler.prototype.updateFrame.call(this);
    var bitmap = this._mainSprite.bitmap;
    if (bitmap) {
        var motionIndex = this._motion ? this._motion.index : 0;
        var pattern = this._pattern < 3 ? this._pattern : 1;
        var cw = bitmap.width / 9;
        var ch = bitmap.height;//var ch = bitmap.height / 6;
        var cx = Math.floor(motionIndex / 6) * 3 + pattern;
        var cy = 0;//var cy = motionIndex % 6;
        this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch);
    }
    if (!this._mainSprite) return;
    if (!this._mainSprite.bitmap) return;
    if (this._mainSprite.bitmap.width > 0 && !this.bitmap) {
      var sw = this._mainSprite.bitmap.width / 9;
      var sh = this._mainSprite.bitmap.height;
      //var sh = this._mainSprite.bitmap.height / 6;
      this.bitmap = new Bitmap(sw, sh);
    }
};

Sprite_Actor.prototype.motionSpeed = function() {
    return 8;
};

//Never mirror sprite.
Sprite_Actor.prototype.updateMove = function() {
    var bitmap = this._mainSprite.bitmap;
    if (!bitmap || bitmap.isReady()) {
        this.setMirror(false);
        Sprite_Battler.prototype.updateMove.call(this);
    }
};

Sprite_Actor.prototype.startEntryMotion = function() 
{
    if (Xillith.GetMonsterFaceing()==1){this._offsetX-=Talonos.mapSyncPosition;this._offsetY+=Talonos.mapSyncPosition}
    if (Xillith.GetMonsterFaceing()==2){this._offsetX+=Talonos.mapSyncPosition;this._offsetY-=Talonos.mapSyncPosition}
    if (Xillith.GetMonsterFaceing()==0){this._offsetX-=Talonos.mapSyncPosition;this._offsetY+=Talonos.mapSyncPosition}
    if (Xillith.GetMonsterFaceing()==3){this._offsetX+=Talonos.mapSyncPosition;this._offsetY-=Talonos.mapSyncPosition}
    this.startMove(0, 0, 20);
};

Sprite_Actor.prototype.updateShadow = function() {
    this._shadowSprite.visible = false;
};

//SPRITE ENEMY

Sprite_Enemy.prototype.setBattler = function(battler) {
    Sprite_Battler.prototype.setBattler.call(this, battler);
    this._svBattlerEnabled = false;
    this.initSVSprites();
    var changed = (battler !== this._enemy);
    if (changed) {
        this._enemy = battler;
        if (battler) {
            var homex = Talonos.storedPlayerScreenPositionX;
            var homey = Talonos.storedPlayerScreenPositionY;
            if (Xillith.GetMonsterFaceing()==1){homey+=12;homex+=36}
            if (Xillith.GetMonsterFaceing()==2){homey-=12;homex-=36}
            if (Xillith.GetMonsterFaceing()==0){homey-=36;homex-=12}
            if (Xillith.GetMonsterFaceing()==3){homey+=36;homex+=12}
            this.setHome(homex, homey);
        }
        this.startEntryMotion();
        this._stateIconSprite.setup(battler);
    }
    this.setSVBattler(battler);
};

//Overwritten to reduce file size of SV Battler
Sprite_Enemy.prototype.updateSVFrame = function() {
    Sprite_Battler.prototype.updateFrame.call(this);
    var bitmap = this._mainSprite.bitmap;
    if (bitmap.width <= 0) return;
    this._effectTarget = this._mainSprite;
    var motionIndex = this._motion ? this._motion.index : 0;
    var pattern = this._pattern < 3 ? this._pattern : 1;
    var cw = bitmap.width / 9;
    var ch = bitmap.height;
    var cx = Math.floor(motionIndex / 6) * 3 + pattern;
    var cy = 0;
    var cdh = 0;
    if (this._effectType === 'bossCollapse') {
      cdh = ch - this._effectDuration;
    }
    this._mainSprite.setFrame(cx * cw, cy * ch, cw, ch - cdh);
    this.adjustMainBitmapSettings(bitmap);
    this.adjustSVShadowSettings();
};

//Overwritten to reduce file size of SV Battler
Sprite_Enemy.prototype.adjustMainBitmapSettings = function(bitmap) {
    if (this._adjustMainBitmapSettings) return;
    this._adjustMainBitmapSettings = true;
    var svw = this._enemy.sideviewWidth();
    var svh = this._enemy.sideviewHeight();
    if (svw === 'auto') svw = bitmap.width / 9;
    if (svh === 'auto') svh = bitmap.height;
    svw = Math.floor(Math.abs(svw * this._enemy.spriteScaleX()));
    svh = Math.floor(Math.abs(svh * this._enemy.spriteScaleY()));
    this.bitmap = new Bitmap(svw, svh);
};

Sprite_Enemy.prototype.initialize = function(battler) {
    Sprite_Battler.prototype.initialize.call(this, battler);
    this.setBattler(battler);
    this.moveToStartPosition();
};

Sprite_Enemy.prototype.moveToStartPosition = function() 
{
    /*if (Xillith.GetMonsterFaceing()==1){this._offsetY+=12;this._offsetX+=36}
    if (Xillith.GetMonsterFaceing()==2){this._offsetY-=12;this._offsetX-=36}
    if (Xillith.GetMonsterFaceing()==0){this._offsetY-=36;this._offsetX-=12}
    if (Xillith.GetMonsterFaceing()==3){this._offsetY+=36;this._offsetX+=12}
    this.startMove(0, 0, 20);*/
};

Talonos.mapSyncPosition = 12;

Sprite_Enemy.prototype.updateMove = function() {
    var bitmap = this._mainSprite.bitmap;
    if (!bitmap || bitmap.isReady()) {
        //this.setMirror(Xillith.GetMonsterFaceing()==1);
        this.setMirror(true);
        Sprite_Battler.prototype.updateMove.call(this);
    }
};

Sprite_Enemy.prototype.startEntryMotion = function() 
{
    /*if (Xillith.GetMonsterFaceing()==1){this._offsetY+=12;this._offsetX+=36}
    if (Xillith.GetMonsterFaceing()==2){this._offsetY-=12;this._offsetX-=36}
    if (Xillith.GetMonsterFaceing()==0){this._offsetY-=36;this._offsetX-=12}
    if (Xillith.GetMonsterFaceing()==3){this._offsetY+=36;this._offsetX+=12}
    this.startMove(0, 0, 20);*/
};

//Replaces YEP_X_AnimatedSVEnemies.js:
Sprite_Enemy.prototype.updateSVBitmap = function() 
{
    Sprite_Battler.prototype.updateBitmap.call(this);
    var name = this._enemy.svBattlerName();
    if (this._svBattlerEnabled && this._svBattlerName !== name) {
      this._createdDummyMainSprite = false;
      this._svBattlerName = name;
      if (Xillith.GetMonsterFaceing()==0){name+="0"}
      if (Xillith.GetMonsterFaceing()==1){name+="2"}
      if (Xillith.GetMonsterFaceing()==2){name+="0"}
      if (Xillith.GetMonsterFaceing()==3){name+="2"}
      this._mainSprite.bitmap = ImageManager.loadSvActor(name);
      this.adjustAnchor();
      this.refreshMotion();
      this.updateScale();
    } else if (this._svBattlerName === '') {
      this._svBattlerName = '';
      this._svBattlerEnabled = false;
      if (this._createdDummyMainSprite) return;
      this._createdDummyMainSprite = true;
      this._mainSprite = new Sprite_Base();
      this._mainSprite.anchor.x = 0.5;
      this._mainSprite.anchor.y = 1;
    }
};

Game_Enemy.prototype.performCollapse = function() {
    Game_Battler.prototype.performCollapse.call(this);
    switch (this.collapseType()) {
    case 0:
        //this.requestEffect('collapse');
        SoundManager.playEnemyCollapse();
        break;
    case 1:
        //this.requestEffect('bossCollapse');
        SoundManager.playBossCollapse1();
        break;
    case 2:
        //this.requestEffect('instantCollapse');
        break;
    }
};

//Victory is super fast.
BattleManager.processVictory = function() {
    $gameTemp.reserveCommonEvent(9);//refresh pictures so element transistion looks normal
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

//Map needs no fadein on battles.
Scene_Map.prototype.needsFadeIn = function() {
    return (//SceneManager.isPreviousScene(Scene_Battle) ||
            SceneManager.isPreviousScene(Scene_Load));
};

//Battle scene needs no fadouts after battles.
Scene_Battle.prototype.stop = function() {
    Scene_Base.prototype.stop.call(this);
	//this.startFadeOut(10, true);
    //this._statusWindow.close();
    //this._partyCommandWindow.close();
    //this._actorCommandWindow.close();
};


//AUTO-BATTLE RELATED STUFF

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

//Not used: Hold buttons to use different skills.
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

//Taken from Yanfly's BEC 1868 and modified.
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

Talonos.oldSceneBattleUpdate = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function() 
{
    Talonos.oldSceneBattleUpdate.call(this);
    if (Input.isTriggered("pageUp"))
    {
        BattleManager.actionCommonEvent(8);
    }
    if (Input.isTriggered("pageDown"))
    {
        BattleManager.actionCommonEvent(7);
    }
    if (Input.isTriggered("1"))
    {
        BattleManager.actionCommonEvent(61);
    }
    if (Input.isTriggered("2"))
    {
        BattleManager.actionCommonEvent(27);
    }
    if (Input.isTriggered("3"))
    {
        BattleManager.actionCommonEvent(28);
    }
    if (Input.isTriggered("4"))
    {
        BattleManager.actionCommonEvent(29);
    }
    if (Input.isTriggered("5"))
    {
        BattleManager.actionCommonEvent(30);
    }
};

//Check if a thing was pressed recently: Used by some action sequences:

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

//FOR MONSTERS:
Game_CharacterBase.prototype.distancePerFrame = function() 
{
    switch (this.realMoveSpeed())
    {
        case 0: return 1/256;
        case 1: return 2/256;
        case 2: return 5/256;
        case 3: return 10/256;
        case 4: return 20/256;
        case 5: return 30/256;
        case 6: return 40/256;
        case 7: return 60/256;
    }
    return Math.pow(2, this.realMoveSpeed()) / 256;
};

//Pause before chasing people.
Game_Event.prototype.startEventChase = function() {
    this._chasePlayer = true;
    if (this.alertConditions())
    {
        this._staggerCount = 24;
    }
    this.setMoveSpeed(this._chaseSpeed);
};

//Baloon faster when chasing people:

Sprite_Balloon.prototype.speed = function() {
    return 3;
};

//For some reason, Yanfly's code has monsters sometimes move randomly when returning...?
//This fixes that.
//TODO: Have the monster pathfind or something.

Game_Event.prototype.updateMoveReturnAfter = function() {
    if (this._returnFrames > 0) return;
    var sx = this.deltaXFrom(this._startLocationX);
    var sy = this.deltaYFrom(this._startLocationY);
    if (Math.abs(sx) > Math.abs(sy)) 
    {
        this.moveStraight(sx > 0 ? 4 : 6);
        if (!this.isMovementSucceeded() && sy !== 0) 
        {
          this.moveStraight(sy > 0 ? 8 : 2);
        }
    } 
    else if (sy !== 0) 
    {
        this.moveStraight(sy > 0 ? 8 : 2);
        if (!this.isMovementSucceeded() && sx !== 0) 
        {
          this.moveStraight(sx > 0 ? 4 : 6);
        }
    }
    if (sx === 0 && sy === 0) 
    {
      this._returnPhase = false;
      this._returnFrames = 0;
      this._direction = this._startLocationDir;
    }
};

//FOR PLAYERS:
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

Talonos.StealthModeCost = 4; //Cost is in mana per second
Talonos.HasteCost = 12; //Cost is in mana per second

Game_Timer.prototype.update = function(sceneActive) 
{
    Talonos.Game_Timer_Update.apply(this, arguments);
    if(this._isPaused || this.isAutoPaused() || !this._working) 
    {
        return;
    }
    var recoverHp = 1;
    var framesPerHpRegen = (36000/2)/$gameParty.allMembers()[0].mhp;
    while (framesPerHpRegen<120)
    {
        recoverHp*=2;
        framesPerHpRegen*=2;
    }

    var recoverMp = 1;
    var framesPerMpRegen = (36000/2)/$gameParty.allMembers()[0].mmp;
    while (framesPerMpRegen<120)
    {
        recoverMp*=2;
        framesPerMpRegen*=2;
    }

    framesPerHpRegen=Math.round(framesPerHpRegen);
    framesPerMpRegen=Math.round(framesPerMpRegen);

    if (this.getFrames()%framesPerHpRegen === 0&&$gameParty.allMembers()[0].hp > 0)
    {
        $gameParty.allMembers()[0].gainHp(recoverHp);
    }
    if (this.getFrames()%framesPerMpRegen === 0)
    {
        $gameParty.allMembers()[0].gainMp(recoverMp);
    }

    if (Input.isTriggered('rest')&&this.getFrames()>1800&&SceneManager._scene.constructor == Scene_Map&&$gameParty.allMembers()[0].hp!=$gameParty.allMembers()[0].mhp)
    {
        $gameParty.allMembers()[0].gainHp(Math.round($gameParty.allMembers()[0].mhp*.12));
        $gameParty.allMembers()[0].gainMp(Math.round($gameParty.allMembers()[0].mmp*.12));
        $gameTimer._frames -= 1800;
        $gamePlayer.requestAnimation(165);
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
            $gameSwitches.setValue(91,false);
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
    //this.addGeneralOptions();
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

//This is really ugly.
Window_Options.prototype.processOk = function() {
    var index = this.index();
    var symbol = this.commandSymbol(index);
    var value = this.getConfigValue(symbol);
    if (this.isExitSymbol(symbol))
    {
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

Talonos.crystalTiers =    [50,150,350,650,1075,1625,2300,3100,4025,5075,6250,7550,8975,10525,12200,14000,15925,17975,20150,22450, 31451]
Talonos.crystalUpgrades = [50,100,200,300,425, 550, 675, 800, 925, 1050,1175,1300,1425,1550, 1675, 1800, 1925, 2050, 2175, 2300, 9001]  
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

//Override
Scene_Map.prototype.fadeInForTransfer = function() {
    var fadeType = $gamePlayer.fadeType();
    switch (fadeType) {
    case 0: case 1:
    $gameScreen.startTint([0, 0, 0, 0], 50);
        this.startFadeIn(this.fadeSpeed(), fadeType === 1);
        break;
    }
};

//Make jumps take longer if you go further.
Game_CharacterBase.prototype.extendedJump = function(xPlus, yPlus, height) {
    if (Math.abs(xPlus) > Math.abs(yPlus)) {
        if (xPlus !== 0) {
            this.setDirection(xPlus < 0 ? 4 : 6);
        }
    } else {
        if (yPlus !== 0) {
            this.setDirection(yPlus < 0 ? 8 : 2);
        }
    }
    this._x += xPlus;
    this._y += yPlus;
    this._jumpPeak = height;
    this._jumpCount = this._jumpPeak * 2;
    this.resetStopCount();
    this.straighten();
};