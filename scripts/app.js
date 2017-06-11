"use strict";

define(['jquery', 'concrete', 'array2d', 'bigint'], function($, Concrete, array2d, bigint) {

  const CONFIG = {
    VIEW_ID:        '#view',
    VIEW_WIDTH:     640,
    VIEW_HEIGHT:    480,
    WORLD_WIDTH:    160,
    WORLD_HEIGHT:   120,
    START_RULE:     30,
    START_SEED:     0,
    CELL_SIZE:      4,
    BTN_START_DIV:  '.button-start-div',
    BTN_STOP_DIV:   '.button-stop-div',
    BTN_START:      '.button-start',
    BTN_STOP:       '.button-stop',
    BTN_STEP:       '.button-step',
    RULE:           '.rule'
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
    this.world = new array2d.Array2d(CONFIG.WORLD_HEIGHT, CONFIG.WORLD_WIDTH, 0);
    this.rule = CONFIG.START_RULE;
    this.speed = 1;
    this.running = false;
    this.interval = undefined;
    this.dt = 100;
    this.steps = 0;
    this.currentRow = 0;
    this.seed = bigInt('604462909807314587353088');
    this.highlightCol = null;
    this.paint = null;
    this.imageIndex = 0;
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
    this.layer1.setSize(CONFIG.VIEW_WIDTH, CONFIG.VIEW_HEIGHT);
    this.layer2.setSize(CONFIG.VIEW_WIDTH, CONFIG.VIEW_HEIGHT);
    this.view            .add(this.layer1).add(this.layer2);

    /* initialize interface */
    $('.slider-speed').val(50);
    $('#rule').val(this.rule);
    $('.rule').text(this.rule);
    this.markRulePips(this.rule);
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
      $('.rule').text(self.rule);
    });

    $('.r').click(function() {
      var n = 1 << parseInt($(this).data('r'));
      $(this).toggleClass('r0').toggleClass('r1');
      self.rule ^= n;
      $('#rule').val(self.rule);
      $('.rule').text(self.rule);
    });

    $('.slider-speed').on('input change', function() {
        self.speed = Math.pow(1.0471285480508995334645020315281400790, $(this).val() - 50);
        self.dt = 100 / self.speed;
        if (self.interval) {
          clearInterval(self.interval);
          self.running = false;
          self.start();
        }
        self.update();
    });

    $('.button-step').click(function() { self.step(); })
    $('.button-start').click(function() { self.start(); })
    $('.button-stop').click(function() { self.stop(); })
    $('.button-randomize').click(function() { self.randomize(); })
    $('.button-reset').click(function() { self.reset(); })
    $('.button-download').click(function() { self.download(self.imageIndex++); });

    $('#seed').val(this.seed.toString());
    $('#seed').on('input change', function() {
      self.seed = bigInt($(this).val());

      if (self.currentRow == 0) {
        self.setInitialSeed(self.seed);
        self.drawWorld();
      }
    })

    $(CONFIG.VIEW_ID).on('contextmenu', function() { return false; });

    $(CONFIG.VIEW_ID).mousedown(function(e) {
      e.preventDefault();
      var pos = self.getMousePos(e);
      self.highlightCol = pos.x;

      self.paint = e.button == 0 ? 1 : 0;
      self.paintCell(self.currentRow, pos.x, self.paint);
      self.update();
    });

    $(CONFIG.VIEW_ID).mouseup(function(e) {
      self.paint = null;
    });

    $(CONFIG.VIEW_ID).mousemove(function(e) {
      var pos = self.getMousePos(e);
      self.highlightCol = pos.x;
      if (self.paint != null) {
        self.paintCell(self.currentRow, pos.x, self.paint);
      }
      self.update();
    });

    $(CONFIG.VIEW_ID).mouseout(function() {
      self.highlightCol = null;
    });

    this.reset();
    this.drawWorld();
    this.update();
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


  App.prototype.setInitialSeed = function(seed) {
    var bits = this.seed.toString(2);
    var width = this.world.getCols();

    while (bits.length < width) bits = '0' + bits;

    for (var i = 0; i < width; ++i) {
      this.world.set(this.currentRow, i, bits[i] == '1' ? 1 : 0);
    }
  };


  App.prototype.update = function() {
    $('.speed').text(this.speed.toFixed(2) + 'x');
    $('.steps').text(this.steps);

    var ctx = this.layer2.scene.context;
    ctx.save();
    ctx.clearRect(0, 0, CONFIG.VIEW_WIDTH, CONFIG.VIEW_HEIGHT);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.fillRect(0, this.currentRow*CONFIG.CELL_SIZE, CONFIG.VIEW_WIDTH, CONFIG.CELL_SIZE);
    if (this.highlightCol != null) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fillRect(this.highlightCol*CONFIG.CELL_SIZE, 0, CONFIG.CELL_SIZE, CONFIG.VIEW_HEIGHT);
    }
    ctx.restore();
  };


  App.prototype.drawWorld = function() {
    var ctx = this.layer1.scene.context;
    var width = this.world.getCols();
    var height = this.world.getRows();

    ctx.save();
    for (var x = 0; x < width; ++x) {
      for (var y = 0; y < height; ++y) {
        ctx.fillStyle = this.world.get(y, x) ? 'black' : 'white';
        ctx.fillRect(x*CONFIG.CELL_SIZE, y*CONFIG.CELL_SIZE, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
        ctx.fill();
      }
    }
    ctx.restore();
  };


  App.prototype.drawCell = function(ctx, x, y, fill) {
    ctx.save();
    ctx.fillStyle = fill ? 'black' : 'white';
    ctx.fillRect(x*CONFIG.CELL_SIZE, y*CONFIG.CELL_SIZE, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
    ctx.fill();
    ctx.restore();
  };


  App.prototype.paintCell = function(row, col, paint) {
    this.world.set(row, col, paint);
    console.log(paint);
    this.drawCell(this.layer1.scene.context, col, row, paint);

    if (row == 0) {
      var pow = bigInt(1).shiftLeft(this.world.getCols() - col - 1);
      if (paint == 1)
        this.seed = this.seed.or(pow);
      if (paint == 0)
        this.seed = this.seed.and(pow.not());

      $('#seed').val(this.seed.toString());
    }
  };


  App.prototype.getMousePos = function(e) {
    var rawPos = getMousePos(e, this.viewContainer);
    var row = Math.floor(rawPos.y / CONFIG.CELL_SIZE);
    var col = Math.floor(rawPos.x / CONFIG.CELL_SIZE);

    return {
      x: col,
      y: row
    };
  };


  App.prototype.step = function() {
    ++this.currentRow;
    ++this.steps;

    if (this.currentRow == this.world.getRows()) {
      this.world.deleteRow(0);
      this.world.addRow(this.world.getRows(), 0);
      --this.currentRow;
    }

    var row = this.currentRow;
    var width = this.world.getCols();
    var height = this.world.getRows();

    for (var x = 0; x < width; ++x) {
      var parents = this.world.get(row-1, (x+width-1)%width).toString() + this.world.get(row-1, x).toString() + this.world.get(row-1, (x+1)%width).toString();
      var rule = 1 << parseInt(parents, 2);
      if (this.rule & rule) {
        this.world.set(row, x, 1);
      } else {
        this.world.set(row, x, 0);
      }
    }

    if (this.highlightCol && this.paint != null) {
      this.world.set(this.currentRow, this.highlightCol, this.paint);
    }

    this.drawWorld();
    this.update();
  };


  App.prototype.reset = function() {
    this.stop();

    this.steps = 0;
    this.currentRow = 0;

    this.world = new array2d.Array2d(CONFIG.WORLD_HEIGHT, CONFIG.WORLD_WIDTH, 0);
    this.setInitialSeed(this.seed);

    this.drawWorld();
    this.update();
  };


  App.prototype.randomize = function() {


    this.update();
  };


  App.prototype.download = function(i) {
    this.view.toScene().download({ fileName: 'image' + i + '.png' });
  };


  App.prototype.start = function() {
    var self = this;

    if (!this.running) {
      this.running = true;
      clearInterval(this.interval);
      this.interval = setInterval(function() { self.step(); }, self.dt);
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
