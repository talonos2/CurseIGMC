//=============================================================================
// Emissive Layer Overlay
// EmissiveLayerOverOverlay.js
// Version 1.0
//=============================================================================

var Imported = Imported || {};
Imported.Jay_EmissiveLayerOverOverlay = true;

var Jay = Jay || {};
Jay.EmissiveLayerOverOverlay = Jay.EmissiveLayerOverOverlay || {};

//=============================================================================
 /*:
 * @plugindesc Make glowing effects that appear over the Shadow layer in OrangeOverlay
 *
 * @author Jason R. Godding
 *
 * @help Whenever a character (including a party member) uses a character sprite set,
 * if there is another sprite set prefaced with "E_" (after any $ and ! markers)
 * that sprite set will also be added to the character over the shadow layer,
 * but masked to still appear "under" any sprites that appear over the base sprite.
 *
 * No parameters, note tags, or plugin commands; just plug in and go.
 *
 * This plugin was commissioned by "Talonos", and probably will not be released
 * for general use. Please credit Jason R. Godding when used.
 * © Jason R. Godding, 2019
 *
 */

Jay.EmissiveLayerOverOverlay.emissiveHeader = "E_";
Jay.EmissiveLayerOverOverlay.shadowLayer = 20;

// === Sprite_CharacterEmissiveLayer ===
// Derives from Sprite_Character
// Represents the part of the sprite in the emissive layer.

function Sprite_CharacterEmissiveLayer() {
    this.initialize.apply(this, arguments);
};

Sprite_CharacterEmissiveLayer.prototype = Object.create(Sprite_Character.prototype);
Sprite_CharacterEmissiveLayer.prototype.constructor = Sprite_CharacterEmissiveLayer;

Sprite_CharacterEmissiveLayer.prototype.initialize = function(character) {
    Sprite_Character.prototype.initialize.call(this, character);
};

Sprite_CharacterEmissiveLayer.prototype.isActive = function() {
    return !!this._characterName;
}
    
Sprite_CharacterEmissiveLayer.prototype.updatePosition = function() {
    this.x = this._character.screenX();
    this.y = this._character.screenY();
    // OrangeOverlay shadows have a Z-value of 20; parallaxes 21. We want
    // something in the middle. How fortunate that fractions work!
    this.z = Jay.EmissiveLayerOverOverlay.shadowLayer + .5;
};

Sprite_CharacterEmissiveLayer.prototype.isEmissiveLayer = function() {
    return true;
};

Sprite_CharacterEmissiveLayer.prototype.updateBitmap = function() {
    if (this.isImageChanged()) {
        this._tilesetId = $gameMap.tilesetId();
        this._tileId = this._character.tileId();
        this._characterName = this._character.emissiveLayerName();
        this._characterIndex = this._character.characterIndex();
        if (this._tileId > 0) {
            this.setTileBitmap();
        } else {
            this.setCharacterBitmap();
        }
    }
};

Sprite_CharacterEmissiveLayer.prototype.isImageChanged = function() {
    return (this._tilesetId !== $gameMap.tilesetId() ||
            this._tileId !== this._character.tileId() ||
            this._characterName !== this._character.emissiveLayerName() ||
            this._characterIndex !== this._character.characterIndex());
};

// Removes all mask data.
Sprite_CharacterEmissiveLayer.prototype.removeMask = function() {
    // I'm only updating it once every five frames, because updating
    // it EVERY frame eats up a ton of memory. Doesn't happen at every
    // five. Go figure.
    this._maskFlusher = this._maskFlusher || 5;
    
    if(--(this._maskFlusher) === 0) {
        // Causes problems if not destroyed here.
        if (this._maskTexture) {
            this._maskTexture.destroy(true);
        }
        
        this._mask = null;
        this._maskContainer = null;
        this._maskTexture = null;
    }
};

// Creates the mask, but doesn't apply it yet. That way, it can be
// called multiple times with each character that should be part of the
// mask.
Sprite_CharacterEmissiveLayer.prototype.addMask = function(character) {
    if (!this._characterName) {
        return;
    }
    if (!character._characterName) {
        return;
    }
    if (this._mask) {
        return;
    }
    if (!this._maskContainer) {
        this._maskContainer = new PIXI.Container();
        var charMask = new PIXI.Graphics();
        charMask.isMask = true;
        charMask.beginFill(0xFFFFFF);
        charMask.drawRect(0, 0, Graphics.width, Graphics.height);
        charMask.endFill();
        this._maskContainer.addChild(charMask);
    }
    var tempSprite = new Sprite_Character(character._character);
    tempSprite.update();
    tempSprite.tint = 0x000000;
    this._maskContainer.addChild(tempSprite);
};

// After addMask has set up the mask layers, this applies them to
// the sprite.
Sprite_CharacterEmissiveLayer.prototype.applyMask = function() {
    if (!this._mask) {
        if (this._maskContainer) {
            // This is kinda hackish, but for whatever bizarre reason, masks
            // ignore most positioning rules, so we need to crop out all sprites
            // too far to the left or top of the screen.
            var frameRect = new PIXI.Rectangle(0, 0, Graphics.width, Graphics.height);
            this._maskContainer.getLocalBounds = function () {
                this.getBounds();
                return frameRect;
            }
            
            this._maskTexture = Graphics._renderer.generateTexture(this._maskContainer);
            this._mask = new PIXI.Sprite(this._maskTexture);
            this._mask.isMask = true;
        }
    }
};

// === Sprite_Character ===

Jay.EmissiveLayerOverOverlay.SpriteCharacterSetCharacter = Sprite_Character.prototype.setCharacter;
Sprite_Character.prototype.setCharacter = function(character) {
    Jay.EmissiveLayerOverOverlay.SpriteCharacterSetCharacter.call(this, character);
    this.setEmissiveOverlay(character);
};

Sprite_Character.prototype.setEmissiveOverlay = function(character) {
    if (this.isEmissiveLayer()) {
        this._elOverlay = null;
    }
    else {
        this._elOverlay = new Sprite_CharacterEmissiveLayer(character);
    }
};

Sprite_Character.prototype.isEmissiveLayer = function() {
    return false;
};

Sprite_Character.prototype.emissiveLayer = function() {
    return this._elOverlay;
};

Jay.EmissiveLayerOverOverlay.SpriteCharacterUpdate = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function() {
    Jay.EmissiveLayerOverOverlay.SpriteCharacterUpdate.call(this);
    this.updateEmissiveLayer();
};

Sprite_Character.prototype.updateEmissiveLayer = function() {
    if (this._elOverlay) {
        this._elOverlay.update();
    }
};

// === Spriteset_Map ===

Jay.EmissiveLayerOverOverlay.CreateCharacters = Spriteset_Map.prototype.createCharacters;
Spriteset_Map.prototype.createCharacters = function() {
    Jay.EmissiveLayerOverOverlay.CreateCharacters.call(this);
    var oldMax = this._characterSprites.length;
    for (var i = 0; i < oldMax; i++) {
        var emissiveLayer = this._characterSprites[i].emissiveLayer();
        if (emissiveLayer) {
            this._characterSprites.push(emissiveLayer);
            this._tilemap.addChild(emissiveLayer);
        }
    }
};

// === Game_CharacterBase ===

Jay.EmissiveLayerOverOverlay.CharacterBase_SetImage = Game_CharacterBase.prototype.setImage;
Game_CharacterBase.prototype.setImage = function(characterName, characterIndex) {
    Jay.EmissiveLayerOverOverlay.CharacterBase_SetImage.call(this, characterName, characterIndex);
    this._emissiveLayerName = this.makeEmissiveLayerName(characterName);
};

Game_CharacterBase.prototype.makeEmissiveLayerName = function(characterName) {
    if (!characterName) {
        return "";
    }
    characterName.match(/^([!\$]*)(.+)$/i);
    var header = RegExp.$1;
    var fileBase = RegExp.$2;
    var path = require('path');
    var base = path.dirname(process.mainModule.filename);
    var eFileName = header + Jay.EmissiveLayerOverOverlay.emissiveHeader + fileBase;
    var fs = require('fs');
    if (fs.existsSync(base + '/img/characters/' + eFileName + '.png')) {
        return eFileName;
    }
    return "";
};

Game_CharacterBase.prototype.emissiveLayerName = function() {
    return this._emissiveLayerName;
};

// === ShaderTilemap ===

ShaderTilemap.prototype.updateTransform = function() {
    if (this.roundPixels) {
        var ox = Math.floor(this.origin.x);
        var oy = Math.floor(this.origin.y);
    } else {
        ox = this.origin.x;
        oy = this.origin.y;
    }
    var startX = Math.floor((ox - this._margin) / this._tileWidth);
    var startY = Math.floor((oy - this._margin) / this._tileHeight);
    this._updateLayerPositions(startX, startY);
    if (this._needsRepaint ||
        this._lastStartX !== startX || this._lastStartY !== startY) {
        this._lastStartX = startX;
        this._lastStartY = startY;
        this._paintAllTiles(startX, startY);
        this._needsRepaint = false;
    }
    this._sortChildren();
    this.setChildMasks();
    PIXI.Container.prototype.updateTransform.call(this);
};

// Creates masks for all emissive layer children.
// Only works after the children have been sorted.
ShaderTilemap.prototype.setChildMasks = function() {
    var elChildren = [];
    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].constructor === Sprite_Character) {
            var character = this.children[i];
            elChildren.forEach(function(elLayer) {
                elLayer.addMask(character);
            });
            if (character.emissiveLayer() && character.emissiveLayer().isActive()) {
                character.emissiveLayer().removeMask();
                elChildren.push(character.emissiveLayer());
            }
        }
        // Because the emissive layers have higher Z-levels, they
        // shouldn't be found until all normal sprites have been checked
        // after the sort. So that's when to apply the masks.
        if (this.children[i].constructor === Sprite_CharacterEmissiveLayer) {
            this.children[i].applyMask();
        }
    }
};