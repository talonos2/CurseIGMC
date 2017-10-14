// ------------------------------------------------
// SOUL_MV Rune Factory HUD.js
// ------------------------------------------------
/*:
* @plugindesc Creates a HUD with the same style as Rune Factory.
* @author Soulpour777 - soulxregalia.wordpress.com (Modded by Talonos)
*
* @help

SOUL_MV Rune Factory 
Author: Soulpour777

Current Build: Version 5
Status: Working Properly, no Bugs

Plugin Commands

change_actor x

where x is the number of the actor you want to be
displayed instead of the default actor.

Place all images in the img / rf_hud folder.

* @param Default Actor
* @desc The default actor that the hud will display its HP and MP. (Changable in Plugin Commands)
* @default 1
*
* @param HUD Switch
* @desc The switch for the hud to BE HIDDEN.
* @default 1
*
* @param HUD Background
* @desc The background image that holds both the HP and MP bars.
* @default HUD_Background
*
* @param HUD Background X
* @desc The x axis of the background image that holds both the HP and MP bars.
* @default 40
*
* @param HUD Background Y
* @desc The y axis of the background image that holds both the HP and MP bars.
* @default 20
*
* @param HP Image
* @desc The hp image that holds both the HP metre.
* @default HP
*
* @param HP Image X
* @desc The x axis of the hp image that holds both the HP metre.
* @default 88
*
* @param HP Image Y
* @desc The y axis of the hp image that holds both the HP metre.
* @default 26
*
* @param MP Image
* @desc The mp image that holds both the MP metre.
* @default MP
*
* @param MP Image X
* @desc The x axis of the mp image that holds both the HP metre.
* @default 88
*
* @param MP Image Y
* @desc The y axis of the mp image that holds both the HP metre.
* @default 50
*
*/
var SOUL_MV = SOUL_MV || {};
SOUL_MV.RuneFactory = {};

SOUL_MV.RuneFactory.pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    SOUL_MV.RuneFactory.pluginCommand.call(this);
    if (command === "change_actor") {
        $gameSystem._defaultActor = args[0];
    }
};


ImageManager.loadRune = function(filename, hue) {
    return this.loadBitmap('img/rf_hud/', filename, hue, true);
};

SOUL_MV.RuneFactory.xinitialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function() {
    SOUL_MV.RuneFactory.xinitialize.call(this);
    this._defaultActor = SOUL_MV.RuneFactory.DefaultActor;
}

SOUL_MV.RuneFactory.DefaultActor = Number(PluginManager.parameters('SOUL_MV Rune Factory')['Default Actor'] || 1);
SOUL_MV.RuneFactory.HudSwitch = Number(PluginManager.parameters('SOUL_MV Rune Factory')['HUD Switch'] || 1);

SOUL_MV.RuneFactory.BackgroundSprite = PluginManager.parameters('SOUL_MV Rune Factory')['HUD Background'] || "HUD_Background";
SOUL_MV.RuneFactory.BackgroundX = Number(PluginManager.parameters('SOUL_MV Rune Factory')['HUD Background X'] || 40);
SOUL_MV.RuneFactory.BackgroundY = Number(PluginManager.parameters('SOUL_MV Rune Factory')['HUD Background Y'] || 20);
SOUL_MV.RuneFactory.HPSprite = PluginManager.parameters('SOUL_MV Rune Factory')['HP Image'] || "HP";
SOUL_MV.RuneFactory.MPSprite = PluginManager.parameters('SOUL_MV Rune Factory')['MP Image'] || "MP";

SOUL_MV.RuneFactory.HPImageX = Number(PluginManager.parameters('SOUL_MV Rune Factory')['HP Image X'] || 88);
SOUL_MV.RuneFactory.HPImageY = Number(PluginManager.parameters('SOUL_MV Rune Factory')['HP Image Y'] || 26);

SOUL_MV.RuneFactory.MPImageX = Number(PluginManager.parameters('SOUL_MV Rune Factory')['MP Image X'] || 88);
SOUL_MV.RuneFactory.MPImageY = Number(PluginManager.parameters('SOUL_MV Rune Factory')['MP Image Y'] || 50);

function Sprite_BarHud() {
 this.initialize.apply(this, arguments);
} 

Sprite_BarHud.prototype = Object.create(Sprite.prototype);
Sprite_BarHud.prototype.constructor = Sprite_BarHud;

Sprite_BarHud.prototype.initialize = function (bitmap) {
    Sprite.prototype.initialize.apply(this, arguments);
    this._backgroundSprite = new Sprite(ImageManager.loadRune(SOUL_MV.RuneFactory.BackgroundSprite));
    this._hpBarSprite = new Sprite(ImageManager.loadRune(SOUL_MV.RuneFactory.HPSprite));
    this._mpBarSprite = new Sprite(ImageManager.loadRune(SOUL_MV.RuneFactory.HPSprite));
    this._xpBarSprite = new Sprite(ImageManager.loadRune(SOUL_MV.RuneFactory.HPSprite));
    this._textSprite = new Sprite();
    this._foregroundSprite = new Sprite(ImageManager.loadRune("guifront"));
    this.addChild(this._backgroundSprite);
    this.addChild(this._hpBarSprite);
    this.addChild(this._mpBarSprite);
    this.addChild(this._xpBarSprite);
    this.addChild(this._textSprite);
    this.addChild(this._foregroundSprite);
}

Sprite_BarHud.prototype.update = function () {
  Sprite.prototype.update.apply(this, arguments);
  this.updateBackground();
  this.updateBar();
}

Sprite_BarHud.prototype.updateBackground = function () {
  this._backgroundSprite.x = SOUL_MV.RuneFactory.BackgroundX;
  this._backgroundSprite.y = SOUL_MV.RuneFactory.BackgroundY;
  this._backgroundSprite.opacity = this.opacity;
  this._foregroundSprite.x = SOUL_MV.RuneFactory.BackgroundX;
  this._foregroundSprite.y = SOUL_MV.RuneFactory.BackgroundY;
  this._foregroundSprite.opacity = this.opacity;
}

Sprite_BarHud.prototype.updateBar= function () {
  this._hpBarSprite.x = this.x + SOUL_MV.RuneFactory.HPImageX;
  this._hpBarSprite.y = this.y + SOUL_MV.RuneFactory.HPImageY;
  this._hpBarSprite.opacity = this.opacity; 
}

Sprite_BarHud.prototype.refreshStuff = function (rate, rate2, rate3) 
{
  console.log("RefreshingStuff");
  this.makeFace(this._actorSprite);
  this.removeChildAt(5);
  this._backgroundSprite = new Sprite(ImageManager.loadRune(SOUL_MV.RuneFactory.BackgroundSprite));
  this._backgroundSprite.bitmap.drawText(this._actor.name(),30,15,130, 32, "center")
  this.addChildAt(this._backgroundSprite, 0);
  this.updateBackground();
  var exp = this._actor.currentExp() - this._actor.expForLevel(this._actor.level);
  var needed = this._actor.expForLevel(this._actor.level+1)-this._actor.expForLevel(this._actor.level);

  this._hpBarSprite.setFrame(0, 0, this._hpBarSprite.bitmap.width * this._actor.hpRate(), this._hpBarSprite.bitmap.height);
  this._mpBarSprite.setFrame(0, 0, this._mpBarSprite.bitmap.width * this._actor.mpRate(), this._mpBarSprite.bitmap.height);
  this._xpBarSprite.setFrame(0, 0, this._xpBarSprite.bitmap.width * exp/needed, this._xpBarSprite.bitmap.height);
  this.oldHp = this._actor.hp;
  this.oldMp = this._actor.mp;
  this.oldXp = this._actor.currentExp();
}

function Sprite_ActorHpBar() {
  this.initialize.apply(this, arguments);
}

Sprite_ActorHpBar.prototype = Object.create(Sprite_BarHud.prototype)

Sprite_ActorHpBar.prototype.makeFace = function(sprite)
{
  var faceWidth = 144;
  var faceHeight = 144;

  sprite.bitmap = ImageManager.loadFace(this._actor.faceName());
  row = Math.floor(this._actor.faceIndex()/4)
  col = Math.floor(this._actor.faceIndex()%4)
  console.log(row);
  console.log(col);
  sprite.setFrame(col * faceWidth, row * faceHeight, faceWidth, faceHeight);
  sprite.position.set(SOUL_MV.RuneFactory.BackgroundX+22, SOUL_MV.RuneFactory.BackgroundY+64);
}

Sprite_ActorHpBar.prototype.constructor = Sprite_ActorHpBar;

Sprite_ActorHpBar.prototype.initialize = function (bitmap) {
  this._actor = null;
  this._actorSprite = new Sprite();
  Sprite_BarHud.prototype.initialize.apply(this, arguments);
  this.addChildAt(this._actorSprite, 2);
}

Sprite_ActorHpBar.prototype.setActor = function (actor) {
  this._actor = actor;
}

//s.bitmap.drawText("Hello",100,80, 200, 0, "center")

Sprite_ActorHpBar.prototype.update = function () {
  Sprite_BarHud.prototype.update .apply(this, arguments);
    //console.log("Updating!");
  if (this._actor) 
  {
    var exp = this._actor.currentExp() - this._actor.expForLevel(this._actor.level);
    if (this._actor.hp != this.oldHp||this._actor.mp != this.oldMp||exp != this.oldXp)
    {
      this.refreshStuff();
    }
  }
}

//Put it on the HUD

Spriteset_Map.prototype.createHud = function() 
{
  if (!this._hud)
  {
    this._hud = new Sprite_ActorHpBar();
    this._hud.setActor($gameActors.actor($gameSystem._defaultActor));
    this._baseSprite.addChildAt(this._hud, 3);
    //this._sprite.children[6].bitmap.drawText("Hello",100,80, 200, 0, "center")
  }
  if($gameSwitches.value(SOUL_MV.RuneFactory.HudSwitch))
  {
    this._hud.opacity = 255
  }
  else
  {
    this._hud.opacity = 0
  }
}

Spriteset_Map.prototype.update = function() {
    Spriteset_Base.prototype.update.call(this);
    this.updateTileset();
    this.updateParallax();
    this.updateTilemap();
    this.updateShadow();
    this.updateWeather();
    this.createHud();
};