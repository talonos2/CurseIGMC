  /*=============================================================================
 * Talon's Final Winter HUD
 * TalonHUD.js
 * Version: 2.1
 * Free for commercial and non commercial use.
 *=============================================================================*/
/*:
 * @plugindesc Final WInter Custom HUD
 *
 * @author Talonos
 *
 * @param HUD On/Off switch
 * @desc What switch turns on and off the HUD?
 * @default 0

 * @help
 * No help is forthcoming. It's all a trick.
 * 
 *=============================================================================*/
  Talonos.HUDParameters = PluginManager.parameters('TalonHUD');
  Talonos.hudOnOff = Number(Talonos.HUDParameters['HUD On/Off switch']);

 /****************************
  *    Scene_Base Changes    *
  ****************************/

  var tHud_SceneBase_start = Scene_Base.prototype.start;

  Scene_Base.prototype.start = function() 
  {
    tHud_SceneBase_start.call(this);
    if (Window_TalonHud.canShowOnScene(this)) {
      this.createTalonHudWindow();
    }
  };

  var tHud_SceneBase_Update = Scene_Base.prototype.update;

  Scene_Base.prototype.update = function() 
  {
    tHud_SceneBase_Update.call(this);
    if (this._talonHudWindow === undefined) 
    {
      return;
    }

    if (SceneManager.isSceneChanging()) 
    {
      this._talonHudWindow.visible = false;
    }
    else
    {
      this._talonHudWindow.visible = true;
    }

    this._talonHudWindow.update();
  };

  Scene_Base.prototype.createTalonHudWindow = function() 
  {
    var newWindow = new Window_TalonHud();
    newWindow.x = 0;
    newWindow.y = 0;
    newWindow._width = 1500;
    newWindow._height = 1500;
    newWindow.opacity = 0;
    newWindow.padding = 0;
    newWindow.margin = 0;

    this.addChild(newWindow);

    this._talonHudWindow = newWindow;
    //this.setBackgroundType(1);
    //this.updateBackground();
  };

 /****************************
  *     Window_TalonHud      *
  ****************************/

  function Window_TalonHud() {
      this.initialize.apply(this, arguments);
  }

  Window_TalonHud.prototype = Object.create(Window_Base.prototype);
  Window_TalonHud.prototype.constructor = Window_TalonHud;

  Window_TalonHud.prototype.initialize = function() {
    Window_Base.prototype.initialize.call(this, 0, 0, 1500, 1500);
    this.createContents()
    this.refresh();
  };

  Window_TalonHud.canShowOnScene = function(scene) 
  {
    if (scene instanceof Scene_Map||scene instanceof Scene_Menu||scene instanceof Scene_Battle)
    {
      return true;
    }
    return false;
  };

  Window_TalonHud.prototype.update = function() 
  {
    Window_Base.prototype.update.call(this);

    this.refresh();
  };

  Window_TalonHud.prototype.refresh = function()
  {
    if (!Talonos.cache)
    {
        Talonos.loadCache()
    }
    if (this.contents)
    {
      this._isDirty = true;
      if (this._isDirty)
      {
        this.contents.clear();
        this.drawStuff();
        this._isDirty = false;
      }
    }
  };

  Talonos.loadCache = function()
  {
      Window_TalonHud.cache = {};
      Window_TalonHud.cache.ElemPlaceholder = ImageManager.loadPicture("ElemPlaceholder");
      Window_TalonHud.cache.jackknifePlaceholder = ImageManager.loadPicture("jackknifePlaceholder");
      Window_TalonHud.cache.mapPlaceholder = ImageManager.loadPicture("mapPlaceholder");
      Window_TalonHud.cache.timerPlaceholder = ImageManager.loadPicture("timerPlaceholder");
      Window_TalonHud.cache.combatPlaceholder = ImageManager.loadPicture("combatPlaceholder");
      Window_TalonHud.cache.enemyPlaceholder = ImageManager.loadPicture("enemyPlaceholder");
      Window_TalonHud.cache.bigOlObfuscation = ImageManager.loadPicture("bigOlObfuscation");
  }

SceneManager.snapForBackground = function() 
{
    if (!Talonos.cache)
    {
        Talonos.loadCache()
    }
    this._backgroundBitmap = this.snap();
    this._backgroundBitmap.blur();
    console.log("Obfuscated!");
    console.log(this._backgroundBitmap)
    this._backgroundBitmap.blt(Window_TalonHud.cache.bigOlObfuscation, 0, 0, 780,1300, 0,0)
    this._backgroundBitmap.blt(Window_TalonHud.cache.jackknifePlaceholder, 0, 0, 404,244, 50,50)
};


/**
 * BLT info:
 *
 * source The bitmap to draw
 * sx The x coordinate in the source
 * sy The y coordinate in the source
 * sw The width of the source image
 * sh The height of the source image
 * dx The x coordinate in the destination
 * dy The y coordinate in the destination
 * [dw=sw] The width to draw the image in the destination
 * [dh=sh] The height to draw the image in the destination
 */

  Window_TalonHud.prototype.drawStuff = function() 
  {
    if (!$gameSwitches.value(Talonos.hudOnOff)) 
    {
        return;
    }
    var scene = SceneManager._scene

    //Break it down:

    //Draw the back of the rock (Needs location, which is based on frame)

    //Draw the gauges

    //Draw the face

    //Draw the front of the rock
    if (scene instanceof Scene_Battle)
    {
      this.contents.blt(Window_TalonHud.cache.combatPlaceholder, 0, 0, 155,572, 0,155)
    }
    else
    {
      this.contents.blt(Window_TalonHud.cache.mapPlaceholder, 0, 0, 155,305, 0,445)
    }

    //Draw the back on the enemy rock

    //Draw the front of the enemy rock
    if (scene instanceof Scene_Battle)
    {
      console.log("Yes, here.");
      this.contents.blt(Window_TalonHud.cache.enemyPlaceholder, 0, 0, 132,103, 1187,186)
    }

    //Draw the elemental rock
    this.contents.blt(Window_TalonHud.cache.ElemPlaceholder, 0, 0, 177,177, 559,574)

    //Draw the stuff on the elemental rock

    //Draw the bouncing orb

    //Draw the orb frame
    if (scene instanceof Scene_Battle)
    {
      this.contents.blt(Window_TalonHud.cache.jackknifePlaceholder, 0, 0, 404,244, 447,505)
    }

    //Draw the back of the timer
    this.contents.blt(Window_TalonHud.cache.timerPlaceholder, 0, 0, 242,71, 529,0)

    //Draw the timer

    //this.drawGauge();
  };

  Window_TalonHud.prototype.drawGauge = function() {
    var x = 0;
    var y = 0;

    var color1 = this.textColor(1);
    var color2 = this.textColor(2);
    var value = 3;
    var maxValue = 10;
    var rate;
    var width = 500;
    var height = 300;

    if (maxValue > 0) 
    {
      rate = parseFloat((value / maxValue).toPrecision(12));
    }
    else 
    {
      rate = 0;
    }

    if (isNaN(rate)) 
    {
      rate = 0;
    }

    rate = rate.clamp(0, 1);

    var fillW;
    var fillH;
    var fillX = x;
    var gaugeY = y;
    var fillY = gaugeY;

    fillW = Math.floor(width * rate);
    fillH = height;

    this.contents.fillRect(0, 0, 300, 600, this.gaugeBackColor());
    this.contents.gradientFillRect(fillX, fillY, fillW, fillH, color1, color2);
  };