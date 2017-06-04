"use strict";

define(['jquery', 'concrete', 'array2d'], function($, Concrete, array2d) {

  const CONFIG = {
    VIEW_ID:        '#view',
    VIEW_WIDTH:     640,
    VIEW_HEIGHT:    480,
    WORLD_WIDTH:    160,
    WORLD_HEIGHT:   120,
    BTN_START_DIV:  '.button-start-div',
    BTN_STOP_DIV:   '.button-stop-div',
    BTN_START:      '.button-start',
    BTN_STOP:       '.button-stop',
    BTN_STEP:       '.button-step',
  };


  var getMousePos = function(e, client) {
    var rect = client.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };


  function App() {
    this.layer1 = undefined;
    this.layer2 = undefined;
    this.interval = undefined;
    this.world = new array2d.Array2d(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT, 0);
  };


  App.prototype.initialize = function() {
    var self = this;

    /* configure Concrete layers */
    this.viewContainer = $(CONFIG.VIEW_ID).get(0);
    this.view = new Concrete.Viewport({
      container: this.viewContainer,
      width: CONFIG.VIEW_WIDTH,
      height: CONFIG.VIEW_HEIGHT
    });
    this.layer1          = new Concrete.Layer();
    this.layer2          = new Concrete.Layer();
    this.view            .add(this.layer1).add(this.layer2);

    /* initialize interface */


    /* configure callbacks */
  };


  App.prototype.update = function() {

  };


  App.prototype.step = function() {


    this.update();
  };



  App.prototype.clear = function() {

  };


  App.prototype.reset = function() {


    this.update();
  };


  App.prototype.start = function() {
    var self = this;

    if (!this.running) {
      this.running = true;
      clearInterval(this.interval);
      this.interval = setInterval(function() { self.step(); }, 10);
    }

    $(CONFIG.DIV_START_ID).hide();
    $(CONFIG.DIV_STOP_ID).show();
  };


  App.prototype.stop = function() {
    this.running = false;
    clearInterval(this.interval);

    $(CONFIG.DIV_START_ID).show();
    $(CONFIG.DIV_STOP_ID).hide();
  };


  App.prototype.run = function() {
    this.initialize();
  };


  return {
    App: App
  };

});
