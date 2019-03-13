(function () {
'use strict';

/**
 * All plugin parameters for this plugin
 *
 * @file parameters
 *
 * @author LTN Games
 */

/*:
 * @pluginname EmissiveOverlaySprite
 * @plugindesc Add an overlay sprite overtop of an existing event's sprite
 * @version 0.1.1
 *
 * @modulename $emissiveOverlay
 * @external
 *
 * @author LTN Games (https://ltngames.gitlab.io/)
 *
 * @help
--------------------------------------------------------------------------------
 # TERMS OF USE
 For use with projects created by Talanos

# INFORMATION
  EmissiveOverlayEvent allows you to add another sprite over top of another
event's sprite without interferring with Orange Overlays layers plugin.

## Compatability
  This plugin changes methods in Spriteset_Map but they should not be ffected
unless your project includes plugins which overwrite methods in Spriteset_Map.

 # Installation
  Simply save this plugin file into your projects /js/plugins/ directory.
  Add it to your projects plugin manager beneath OrangeOverlay and
  ExtraMovementFrames plugins.

 # GETTING STARTED
  To start you should make sure all sprites you require are located in your
 /img/characters/ directory. Then on the event you would like to add an
 emissive sprite to, you simply include the note-tag below in an event comment.

 # Notetag
  <EmissiveSprite: FilenameForSprtesheet>

 # Plugin Commands
 Main Comand: EmissiveEvent

 SubCommand: remove [eventId]
 Will remove the events emissive sprite

 Example: Emissive event remove 1

 # Script Calls
 A little more advanced than your average script call you must first obtain the
 map scene's spriteset.

 var spriteset= SceneManager._scene._spriteset

 Then you can proceed to manipulate the emissiveSprite by adding or removing
 emissive sprites.

 spriteset.removeEmissiveSprite(eventId)
 spriteset.createEmissiveSprite({
   eventId: 0
   filename: ''
 })

*/

(function () {

  /**
   * Cleans the path by replacing two forward slashes with one.
   *
   * @function cleanPath
   * @since 1.0.0
   * @memberof module:File
   *
   * @param {string} path - The path you want to clean.
   * @return {string} The cleaned string.
   * @example
   * import { cleanPath } from 'fenix-tools'
   *
   * const badUrl = 'C://Path//to/something//'
   *
   * console.log(cleanPath(badUrl)) // => 'C:/Path/to/something/'
   */

  /**
   * Uses regex to recursively filter a string.
   *
   * @function filterText
   * @since 1.0.0
   * @memberof module:Utils
   *
   * @param {string} text - The text you would like to filter
   * @param {regex} regex - The regex pattern to use for filtering
   * @param {function} action - The callback function to evaluate
   *
   * @returns {array} An array of groups that match the evaluation
   * @example
   * import {filterText} from 'fenix-tools'
   *
   * const re = /pattern/g
   * const matches = filterText(text, re, (match) => {
   *  console.log(match) // => The full match group returned from regex
   *  // Perform an evaluation to store specific matches
   * })
   *
   */

  function filterText(text, regex, action) {
    var result = [];
    var match = void 0;
    var re = regex;
    while (match = re.exec(text)) {
      // eslint-disable-line no-cond-assign
      if (action(match)) {
        result.push(match);
      }
    }
    return result;
  }

  /**
   * Finds and extracts a notetag from a string of text and returns it's values.
   * Not much different from using {@link module:Utils.getMetaData|getMetaData}, but
   * if you need more control over the string then use this method.
   *
   * @function getTag
   * @since 1.0.0
   * @memberof module:Utils
   *
   * @param {string} text - The text to be evaluated
   * @param {string} tag - The tag to search for in the text
   *
   * @returns {Array} - An array of parameters of the values within the tag <tag: value, value>
   * @example
   * import { getTag } from 'fenix-tools'
   *
   * // $dataActors[1].note = '<myTag: value, value2, value3>'
   *
   * const myTag = getTag($dataActors[1].note, 'myTag') // => 'value, value2, value3'
   *
   *
   */
  function getTag(text, tag) {
    if (!text || !tag) {
      return;
    }
    var result = [];
    var re = /<([^<>:]+)(:?)([^>]*)>/g;
    var matches = filterText(text, re, function (match) {
      return match[1].toLowerCase() === tag.toLowerCase();
    });
    matches.forEach(function (group) {
      result.push(group[3].trim());
    });
    return result;
  }

  /**
   * Scan all events on map and extract their comments. This can only be used when
   * the map data is available upon map load. It starts by looping through all events
   * in the current map and through each event page storing all comments.
   *
   * @function loadEventComments
   * @since 1.0.0
   * @memberof module:Utils
   *
   * @return {object} An object of all comments added together, sorted by eventId
   *
   * @example
   * const mapEventComments = loadEventComments()
   * // =>  *  // { 28: [param1, param2, param3] }
   *           // { 29: [param1, param2, param3] }
   *
   *
   */
  function loadEventComments() {
    var allEvents = window.$dataMap.events;
    var meta = {};

    allEvents.filter(function (event) {
      return event;
    }).forEach(function (event) {
      var pages = event.pages;
      var eventId = event.id;
      var pageComments = [];
      pages.forEach(function (page, index) {
        var pageId = pages.indexOf(pages[index]);
        if (pageId >= -1) {
          var comments = '';
          page.list.forEach(function (command) {
            if (command.code === 108 || command.code === 408) {
              comments += command.parameters[0];
            }
          });
          if (comments) {
            pageComments.push(comments);
          }
        }
      });
      if (pageComments.length > 0) {
        meta[eventId] = pageComments;
      }
    });
    return meta;
  }

  function getEmissiveSpriteNotetags() {
    var allComments = loadEventComments();
    var emissiveNotetags = [];

    Object.keys(allComments).forEach(function (event) {
      var eventId = Number(event);
      var eventNotetags = allComments[event];

      if (eventNotetags.length > 0) {
        eventNotetags.forEach(function (notetag) {
          return emissiveNotetags.push({
            eventId,
            filename: getTag(notetag, 'EmissiveSprite')[0]
          });
        });
      }
    });
    return emissiveNotetags;
  }

  var oldPluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function (command, args) {
    if (command.toLowerCase() === 'emissiveevent') {
      var spriteset = SceneManager._scene._spriteset;

      switch (args[0].toLowerCase()) {
        case 'remove':
          if (spriteset.emissiveSpriteLayer()) {
            spriteset.removeEmissiveSprite(args[1]);
          }
          break;

        default:
          console.error(`Unable to find sub-command ${args[0]} for command ${command}`);
          break;
      }
    } else {
      oldPluginCommand.call(this, command, args);
    }
  };

  /**
   * An emissive event is just a normal Game_Event without touch interaction and
   * is use only for the sprite
   *
   * @class EmissiveEvent
   * @extends {Game_Event}
   */
  class EmissiveEvent extends Game_Event {
    constructor(mapId, eventId) {
      super(mapId, eventId);
      this._originalEvent = null;
    }

    update() {
      if (this.isStopping()) {
        this.updateStop();
      }
      this.copyPosition(this._originalEvent);
      this.updateAnimation();
    }

    checkEventTriggerTouch() {}

    checkEventTriggerTouchFront() {}

    setOriginalEvent(event) {
      this._originalEvent = event;
    }

    getOriginalEvent() {
      return this._originalEvent;
    }
  }

  function eventPageComments(event) {
    return event.list().filter(function (c) {
      return c.code === 108 || c.code === 408;
    }).map(function (command) {
      return command.parameters;
    });
  }

  function eventHasComments(event) {
    return eventPageComments(event).length > 0;
  }

  function eventPageHasTag(event) {
    if (eventHasComments(event)) {
      return eventPageComments(event).some(function (comments) {
        return comments.some(function (comment) {
          return comment.toLowerCase().includes('emissivesprite');
        });
      });
    }
  }

  function boxesIntersect(a, b) {
    var ab = a.getBounds();
    var bb = b.getBounds();
    return ab.x + ab.width > bb.x && ab.x < bb.x + bb.width && ab.y + ab.height > bb.y && ab.y < bb.y + bb.height;
  }

  Spriteset_Map.prototype.emissiveSpriteLayer = function () {
    return this._emissiveSpriteLayer;
  };

  Spriteset_Map.prototype.createEmissiveSprite = function (data) {
    if (data && data.filename) {
      var originalEvent = $gameMap.events().filter(function (event) {
        return event.eventId() === data.eventId;
      })[0];
      var emissiveEvent = new EmissiveEvent($gameMap.mapId(), originalEvent.eventId());
      var emissiveSprite = new Sprite_Character(emissiveEvent);

      if (eventPageHasTag(originalEvent)) {
        emissiveEvent.setOriginalEvent(originalEvent);
        emissiveEvent.setImage(data.filename, 0);
        this._emissiveSpriteLayer.addChild(emissiveSprite);
      }
    }
  };

  Spriteset_Map.prototype.getPlayerSprite = function () {
    return this._characterSprites.filter(function (sprite) {
      return sprite._characterName === $gamePlayer._characterName;
    })[0];
  };

  Spriteset_Map.prototype.removeEmissiveSprite = function (eventId) {
    return this._emissiveSpriteLayer.children.forEach(function (child) {
      if (child._character.eventId() === Number(eventId)) {
        child.destroy();
      }
    });
  };

  var oldSpritesetMapUpdate = Spriteset_Map.prototype.update;

  Spriteset_Map.prototype.update = function () {
    var _this = this;

    oldSpritesetMapUpdate.call(this);
    if (this._emissiveSpriteLayer) {
      this._emissiveSpriteLayer.children.forEach(function (child) {
        var originalEvent = child._character.getOriginalEvent();

        if (eventPageHasTag(originalEvent)) {
          child._character.update();
          if (boxesIntersect(child, _this.getPlayerSprite())) {
            _this.getPlayerSprite().z = 20;
          }
        } else {
          child.destroy();
        }
      });
    }
  };

  var oldSpritesetMap_createCharacters = Spriteset_Map.prototype.createCharacters;

  Spriteset_Map.prototype.createCharacters = function () {
    var _this2 = this;

    oldSpritesetMap_createCharacters.call(this);
    this._emissiveSpriteLayer = new Sprite();
    this._emissiveSpriteLayer.z = 20;
    var emissiveSpriteNotetags = getEmissiveSpriteNotetags();
    emissiveSpriteNotetags.forEach(function (data) {
      _this2.createEmissiveSprite(data);
    });
    var index = 14;

    this._tilemap.children.forEach(function (child) {
      if (child === _this2._parallaxLayer) {
        index = _this2._tilemap.children.indexOf(child) - 1;
      }
    });
    this._tilemap.addChildAt(this._emissiveSpriteLayer, index);
  };
})();
/* Built By FeniXCLI - Powered by Rollup */

}());
