mindmaps.CanvasDrawingUtil = {
  /**
   * Calculates the width of a branch for a node for the given depth
   *
   * @param {Integer} depth the depth of the node
   * @returns {Number}
   */
  getLineWidth : function(zoomFactor, depth) {
    // var width = this.zoomFactor * (10 - depth);
    var width = zoomFactor * (12 - depth * 2);

    if (width < 2) {
      width = 2;
    }

    return width;
  },

  /**
   * Draws a rounded rectangle
   * @param ctx
   * @param x
   * @param y
   * @param width
   * @param height
   * @param radius
   */
  roundedRect : function roundedRect(ctx, x, y, width, height, radius) {
    // from MDN docs
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height
        - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
    ctx.stroke();
    ctx.fill();
  }
};

/**
 * Object that draws the line connection (the branch) between two nodes onto a
 * canvas object.
 *
 * @constructor
 */
mindmaps.CanvasBranchDrawer = function() {
  /**
   * Callback during render() method. Is called after calculating the
   * boundaries of the line and before actual drawing.
   *
   * @event
   */
  this.beforeDraw = function(width, height, left, top) {

  };


  this.renderLink = function(ctx, depth/*, offsetX, offsetY*/, $node, $parent, color, zoomFactor){

    offsetX = $parent.position().left * zoomFactor;
    offsetY = $parent.position().top * zoomFactor;

    py = $parent.position().top;
    px = $parent.position().left;
    ny = $node.position().top;
    nx = $node.position().left;

    ctx.font = "20px Georgia";
    ctx.strokeText("Hello World!",50 * zoomFactor,50 * zoomFactor);
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;

    canvasWidth = 0;
    canvasHeight = 0;
    canvasTop = 0;
    canvasLeft = 0;

    if (py >= ny){ //node is on top of the parent
      if (px >= nx){//node on the left of the parent
        console.log("top left");
        console.log("distance x : ", px - nx);
        console.log("distance y : ", py - ny);
        canvasWidth = px - nx - $node.width()/2;
        canvasHeight = py - ny - $node.innerHeight();
        canvasLeft = -(px - nx) + $node.width()/2;
        canvasTop = -(py - ny) + $node.innerHeight();
        console.log(canvasWidth, " ", canvasHeight, " ", canvasLeft, " ", canvasTop);
        this.beforeDraw(canvasWidth, canvasHeight, canvasLeft, canvasTop);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvasWidth, canvasHeight);
      } else {//node on the right of the parent
        console.log("top right");
        console.log("distance x : ", nx - px);
        console.log("distance y : ", py - ny);
        canvasWidth = nx - px;
        canvasHeight = py - ny;
        canvasLeft = $parent.width();
        canvasTop = -(py - ny);
        console.log(canvasWidth, " ", canvasHeight, " ", canvasLeft, " ", canvasTop);
        this.beforeDraw(canvasWidth, canvasHeight, canvasLeft, canvasTop);
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight);
        ctx.lineTo(canvasWidth, 0);
      }
    } else {//node is below the parent
      if (px >= nx){//node on the left of the parent
        console.log("bottom left");
        console.log("distance x : ", px - nx);
        console.log("distance y : ", ny - py);
        canvasWidth = px - nx;
        canvasHeight = ny - py;
        canvasLeft = -(px - nx);
        canvasTop = $parent.innerHeight();
        console.log(canvasWidth, " ", canvasHeight, " ", canvasLeft, " ", canvasTop);
        this.beforeDraw(canvasWidth, canvasHeight, canvasLeft, canvasTop);
        ctx.beginPath();
        ctx.moveTo(canvasWidth, 0);
        ctx.lineTo(0, canvasHeight);
      } else {//node on the right of the parent
        console.log("bottom right");
        console.log("distance x : ", nx - px);
        console.log("distance y : ", ny - py);
        canvasWidth = nx - px;
        canvasHeight = ny - py;
        canvasLeft = $parent.width();
        canvasTop = $parent.innerHeight();
        console.log(canvasWidth, " ", canvasHeight, " ", canvasLeft, " ", canvasTop);
        this.beforeDraw(canvasWidth, canvasHeight, canvasLeft, canvasTop);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(canvasWidth, canvasHeight);
      }
    }

    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctx.setLineDash([5, 5]);
    ctx.stroke();

    console.log("pouet3");
  };

  /**
   * Render that.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {Integer} depth
   * @param {Number} offsetX
   * @param {Number} offsetY
   * @param {jQuery} $node
   * @param {jQuery} $parent
   * @param {String} color
   * @param {Number} zoomFactor
   * @param {Boolean} dotted
   */
  this.render = function(ctx, depth, offsetX, offsetY, $node, $parent, color, zoomFactor, dotted) {

    offsetX = offsetX * zoomFactor;
    offsetY = offsetY * zoomFactor;
    ctx.strokeText("Hello World!",offsetX, offsetY);
    var pw = $parent.width();
    var nw = $node.width();
    var pih = $parent.innerHeight();
    var nih = $node.innerHeight();

    // line is drawn from node to parent
    // draw direction
    var leftToRight, topToBottom;

    // node overlaps with parent above or delow
    var overlap = false;

    // canvas attributes
    var left, top, width, height;
    var bColor;

    // position relative to parent
    var nodeLeft = offsetX + nw / 2 < pw / 2;
    if (nodeLeft) {
      var aOffsetX = Math.abs(offsetX);
      if (aOffsetX > nw) {
        // normal left

        // make it one pixel too wide to fix firefox rounding issues
        width = aOffsetX - nw + 1;
        left = nw;
        leftToRight = true;

        // bColor = "red";
      } else {
        // left overlap
        left = -offsetX;
        width = nw + offsetX;
        leftToRight = false;
        overlap = true;

        // bColor = "orange";
      }
    } else {
      if (offsetX > pw) {
        // normal right

        // make it one pixel too wide to fix firefox rounding issues
        width = offsetX - pw + 1;
        left = pw - offsetX;
        leftToRight = false;

        // bColor = "green";
      } else {
        // right overlap
        width = pw - offsetX;
        left = 0;
        leftToRight = true;
        overlap = true;

        // bColor = "yellow";
      }
    }

    var lineWidth = mindmaps.CanvasDrawingUtil.getLineWidth(zoomFactor,
        depth);
    var halfLineWidth = lineWidth / 2;

    // avoid zero widths
    if (width < lineWidth) {
      width = lineWidth;
    }

    var nodeAbove = offsetY + nih < pih;
    if (nodeAbove) {
      top = nih;
      height = $parent.outerHeight() - offsetY - top;

      topToBottom = true;
    } else {
      top = pih - offsetY;
      height = $node.outerHeight() - top;

      topToBottom = false;
    }

    // fire before draw event
    this.beforeDraw(width, height, left, top);

    // determine start and end coordinates
    var startX, startY, endX, endY;
    if (leftToRight) {
      startX = 0;
      endX = width;
    } else {
      startX = width;
      endX = 0;
    }

    // calculate difference in line width to parent node
    // and position line vertically centered to parent line
    var pLineWidth = mindmaps.CanvasDrawingUtil.getLineWidth(zoomFactor,
        depth - 1);
    var diff = (pLineWidth - lineWidth) / 2;

    if (topToBottom) {
      startY = 0 + halfLineWidth;
      endY = height - halfLineWidth - diff;
    } else {
      startY = height - halfLineWidth;
      endY = 0 + halfLineWidth + diff;
    }

    // calculate bezier points
    if (!overlap) {
      var cp2x = startX > endX ? startX / 5 : endX - (endX / 5);
      var cp2y = endY;

      var cp1x = Math.abs(startX - endX) / 2;
      var cp1y = startY;
    } else {
      // node overlaps with parent

      // take left and right a bit away so line fits fully in canvas
      if (leftToRight) {
        startX += halfLineWidth;
        endX -= halfLineWidth;
      } else {
        startX -= halfLineWidth;
        endX += halfLineWidth;
      }

      // reversed bezier for overlap
      var cp1x = startX;
      var cp1y = Math.abs(startY - endY) / 2;

      var cp2x = endX;
      var cp2y = startY > endY ? startY / 5 : endY - (endY / 5);
    }

    // draw
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    if(dotted){
      ctx.setLineDash([10,5]);
    }else{
      ctx.setLineDash([]);
    }

    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
    ctx.stroke();

    var drawControlPoints = false;
    if (drawControlPoints) {
      // control points
      ctx.beginPath();
      ctx.fillStyle = "red";
      ctx.arc(cp1x, cp1y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "green";
      ctx.arc(cp2x, cp2y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };
};

/**
 * Utility module that calculates how much space a text would take up in a node.
 * This is done through a dummy div that has the same formatting as the node and
 * gets the text injected.
 *
 */
mindmaps.TextMetrics = (function() {
  var $div = $("<div/>", {
    "class" : "node-text-behaviour"
  }).css({
    position : "absolute",
    visibility : "hidden",
    height : "auto",
    width : "auto"
  }).prependTo($("body"));

  return {
    /**
     * @constant
     */
    ROOT_CAPTION_MIN_WIDTH : 100,

    /**
     * @constant
     */
    NODE_CAPTION_MIN_WIDTH : 70,

    /**
     * @constant
     */
    NODE_CAPTION_MAX_WIDTH : 150,

    /**
     * Calculates the width and height a node would have to provide to show
     * the text.
     *
     * @param {mindmaps.Node} node the node whose text is to be measured.
     * @param {mindmaps.Node} [text] use this instead of the text of node
     * @returns {Object} object with properties width and height.
     */
    getTextMetrics : function(node, zoomFactor, text) {
      zoomFactor = zoomFactor || 1;
      text = text || node.getCaption();
      var font = node.text.font;
      var minWidth = node.isRoot() ? this.ROOT_CAPTION_MIN_WIDTH
          : this.NODE_CAPTION_MIN_WIDTH;
      var maxWidth = this.NODE_CAPTION_MAX_WIDTH;

      $div.css({
        "font-size" : zoomFactor * font.size,
        "min-width" : zoomFactor * minWidth,
        "max-width" : zoomFactor * maxWidth,
        "font-weight" : font.weight
      }).text(text);

      // add some safety pixels for firefox, otherwise it doesnt render
      // right on textareas
      var w = $div.width() + 2;
      var h = $div.height() + 2;

      return {
        width : w,
        height : h
      };
    }
  };
})();
