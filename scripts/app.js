"use strict";

define(['jquery', 'concrete', 'array2d'], function($, Concrete, array2d) {

  const CONFIG = {
    VIEW_ID:        '#view',
    VIEW_WIDTH:     640,
    VIEW_HEIGHT:    480,
    WORLD_WIDTH:    160,
    WORLD_HEIGHT:   120,
    START_RULE:     30,
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
    this.world = new array2d.Array2d(CONFIG.WORLD_HEIGHT, CONFIG.WORLD_WIDTH, '0');
    this.rule = 0;
    this.speed = 1;
    this.running = false;
    this.interval = undefined;
    this.steps = 0;
    this.currentRow = 0;
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
    $('.slider-speed').val(0);
    $('#rule').val(0);
    $(CONFIG.BTN_START_DIV).show();
    $(CONFIG.BTN_STOP_DIV).hide();

    /* configure callbacks */
    $('#rule').on('input change', function() {
      var r = parseInt($(this).val());
      if (r < 0) r == 0;
      if (r > 255) r = 255;
      $(this).val(r);
      self.markRulePips(r);
      self.rule = r;
    });

    $('.r').click(function() {
      var n = 1 << parseInt($(this).data('r'));
      $(this).toggleClass('r0').toggleClass('r1');
      self.rule ^= n;
      $('#rule').val(self.rule);
    });

    $('.slider-speed').on('input change', function() {
        self.speed = Math.pow(1.032713, $(this).val());
        self.update();
    });

    $('.button-step').click(function() { self.step(); })
    $('.button-start').click(function() { self.start(); })
    $('.button-stop').click(function() { self.stop(); })
    $('.button-randomize').click(function() { self.randomize(); })

    //this.update();
  };


  App.prototype.markRulePips = function(r) {
    if (r & 1) $('[data-r=0]').removeClass('r0').addClass('r1'); else $('[data-r=0]').removeClass('r1').addClass('r0');
    if (r & 2) $('[data-r=1]').removeClass('r0').addClass('r1'); else $('[data-r=1]').removeClass('r1').addClass('r0');
    if (r & 4) $('[data-r=2]').removeClass('r0').addClass('r1'); else $('[data-r=2]').removeClass('r1').addClass('r0');
    if (r & 8) $('[data-r=3]').removeClass('r0').addClass('r1'); else $('[data-r=3]').removeClass('r1').addClass('r0');
    if (r & 16) $('[data-r=4]').removeClass('r0').addClass('r1'); else $('[data-r=4]').removeClass('r1').addClass('r0');
    if (r & 32) $('[data-r=5]').removeClass('r0').addClass('r1'); else $('[data-r=5]').removeClass('r1').addClass('r0');
    if (r & 64) $('[data-r=6]').removeClass('r0').addClass('r1'); else $('[data-r=6]').removeClass('r1').addClass('r0');
    if (r & 128) $('[data-r=7]').removeClass('r0').addClass('r1'); else $('[data-r=7]').removeClass('r1').addClass('r0');
  };


  App.prototype.update = function() {
    $('.speed').text(this.speed.toFixed(2));
    $('.steps').text(this.steps);

    this.drawWorld();
  };


  App.prototype.drawWorld = function() {
    var ctx = this.layer1.scene.context;
    var width = this.world.getCols();
    var height = this.world.getRows();

    ctx.save();
    for (var x = 0; x < width; ++x) {
      for (var y = 0; y < height; ++y) {
        ctx.fillStyle = this.world.get(y, x) == '1' ? 'black' : 'white';
        ctx.fillRect(x*5, y*5, 5, 5);
        ctx.fill();
      }
    }
    ctx.restore();
  };


  App.prototype.step = function() {
    ++this.currentRow;

    if (this.currentRow == this.world.getRows()) {
      this.world.deleteRow(0);
      this.world.addRow(this.world.getRows()-1, '0');
      --this.currentRow;
    }

    console.log(this.currentRow, this.world.getRows());

    var row = this.currentRow;
    var width = this.world.getCols();
    var height = this.world.getRows();

    for (var x = 0; x < width; ++x) {
      var parents = this.world.get(row-1, (x+width-1)%width) + this.world.get(row-1, x) + this.world.get(row-1, (x+1)%width);
      var rule = 1 << parseInt(parents, 2);
      console.log(rule);
      if (this.rule & rule) {
        this.world.set(row, x, '1');
      } else {
        this.world.set(row, x, '0');
      }
    }

    this.update();
  };


  App.prototype.reset = function() {
    this.stop();

    this.steps = 0;
    this.currentRow = 0;

    this.update();
  };


  App.prototype.randomize = function() {


    this.update();
  };


  App.prototype.start = function() {
    var self = this;

    if (!this.running) {
      this.running = true;
      clearInterval(this.interval);
      this.interval = setInterval(function() { self.step(); }, 10);
    }

    $(CONFIG.BTN_START_DIV).hide();
    $(CONFIG.BTN_STOP_DIV).show();
  };


  App.prototype.stop = function() {
    this.running = false;
    clearInterval(this.interval);
    this.interval = undefined;

    $(CONFIG.BTN_START_DIV).show();
    $(CONFIG.BTN_STOP_DIV).hide();
  };


  App.prototype.run = function() {
    this.initialize();
  };


  return {
    App: App
  };

});
