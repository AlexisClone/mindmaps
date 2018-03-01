// TODO take container as argument,c reate drawing area dynamically. remove on
// clear();, recreate on init()

/**
 * Creates a new CanvasView. This is the base class for all canvas view
 * implementations.
 *
 * @constructor
 */
mindmaps.CanvasView = function() {
  /**
   * Returns the element that used to draw the map upon.
   *
   * @returns {jQuery}
   */
  this.$getDrawingArea = function() {
    return $("#drawing-area");
  };

  /**
   * Returns the element that contains the drawing area.
   *
   * @returns {jQuery}
   */
  this.$getContainer = function() {
    return $("#canvas-container");
  };



  /**
   * Scrolls the container to show the center of the drawing area.
   */
  this.center = function() {
    var c = this.$getContainer();
    var area = this.$getDrawingArea();
    var w = area.width() - c.width();
    var h = area.height() - c.height();
    this.scroll(w / 2, h / 2);
  };

  /**
   * Scrolls the container.
   *
   * @param {Number} x
   * @param {Number} y
   */
  this.scroll = function(x, y) {
    var c = this.$getContainer();
    c.scrollLeft(x).scrollTop(y);
  };

  /**
   * Changes the size of the drawing area to match with with the new zoom
   * factor and scrolls the container to adjust the view port.
   */
  this.applyViewZoom = function() {
    var delta = this.
    Delta;
    // console.log(delta);

    var c = this.$getContainer();
    var sl = c.scrollLeft();
    var st = c.scrollTop();

    var cw = c.width();
    var ch = c.height();
    var cx = cw / 2 + sl;
    var cy = ch / 2 + st;

    cx *= this.zoomFactorDelta;
    cy *= this.zoomFactorDelta;

    sl = cx - cw / 2;
    st = cy - ch / 2;
    // console.log(sl, st);

    var drawingArea = this.$getDrawingArea();
    var width = drawingArea.width();
    var height = drawingArea.height();
    drawingArea.width(width * delta).height(height * delta);

    // scroll only after drawing area's width was set.
    this.scroll(sl, st);

    // adjust background size
    var backgroundSize = parseFloat(drawingArea.css("background-size"));
    if (isNaN(backgroundSize)) {
      // parsing could possibly fail in the future.
      console.warn("Could not set background-size!");
    }
    drawingArea.css("background-size", backgroundSize * delta);
  };

  /**
   * Applies the new size according to current zoom factor.
   *
   * @param {Integer} width
   * @param {Integer} height
   */
  this.setDimensions = function(width, height) {
    width = width * this.zoomFactor;
    height = height * this.zoomFactor;

    var drawingArea = this.$getDrawingArea();
    drawingArea.width(width).height(height);
  };

  /**
   * Sets the new zoom factor and stores the delta to the old one.
   *
   * @param {Number} zoomFactor
   */
  this.setZoomFactor = function(zoomFactor) {
    this.zoomFactorDelta = zoomFactor / (this.zoomFactor || 1);
    this.zoomFactor = zoomFactor;
  };
};

/**
 * Should draw the mind map onto the drawing area.
 *
 * @param {mindmaps.MindMap} map
 */
mindmaps.CanvasView.prototype.drawMap = function(map) {
  throw new Error("Not implemented");
};

/**
 * Creates a new DefaultCanvasView. This is the reference implementation for
 * drawing mind maps.
 *
 * @extends mindmaps.CanvasView
 * @constructor
 */
mindmaps.DefaultCanvasView = function() {
  var self = this;
  var nodeDragging = false;
  var creator = new Creator(this);
  var captionEditor = new CaptionEditor(this);

  captionEditor.commit = function(node, text) {
    if (self.nodeCaptionEditCommitted) {
      self.nodeCaptionEditCommitted(node, text);
    }
  };

  var commentEditor = new CommentEditor(this);
  commentEditor.commit1 = function(node, text) {
    console.log("CanvasView.js commit1()");
    if (self.nodeCommentEditCommitted) {
      self.nodeCommentEditCommitted(node, text);
    }
  };

  var textMetrics = mindmaps.TextMetrics;
  var branchDrawer = new mindmaps.CanvasBranchDrawer();
  branchDrawer.beforeDraw = function(width, height, left, top) {
    this.$canvas.attr({
      width : width,
      height : height
    }).css({
      left : left,
      top : top
    });
  };

  /**
   * Enables dragging of the map with the mouse.
   */
  function makeDraggable() {
    self.$getContainer().dragscrollable({
      dragSelector : "#drawing-area, canvas.line-canvas",
      acceptPropagatedEvent : false,
      delegateMode : true,
      preventDefault : true
    });
  }

  function $getNodeCanvas(node) {
    return $("#node-canvas-" + node.id);
  }

  function $getNode(node) {
    return $("#node-" + node.id);
  }

  function $getNodeCaption(node) {
    return $("#node-caption-" + node.id);
  }

  function $getNodeDescription(node) {
    return $("#comment");
  }

  function drawLineCanvas($canvas, depth, offsetX, offsetY, $node, $parent, color, dotted) {
    var dotted = dotted || false;
    var canvas = $canvas[0];
    var ctx = canvas.getContext("2d");

    // set $canvas for beforeDraw() callback.
    branchDrawer.$canvas = $canvas;
    branchDrawer.render(ctx, depth, offsetX, offsetY, $node, $parent,
        color, self.zoomFactor, dotted);
  }

/**
 * function used to draw a symbolic link
 *
 */
  function drawLinkCanvas($canvas, offsetX, offsetY, $node, $parent){
    drawLineCanvas($canvas, 1, offsetX, offsetY, $node, $parent, "#A9A9A9", true);
  }

  function $getImageDescription(node) {
    return $("#"+node.id+"-img");
  }

  this.init = function() {
    makeDraggable();
    this.center();

    var $drawingArea = this.$getDrawingArea();
    $drawingArea.addClass("mindmap");

    // setup delegates
    $drawingArea.delegate("div.node-caption", "mousedown", function(e) {
      var node = $(this).parent().data("node");

      if (self.nodeMouseDown) {
        self.nodeMouseDown(node);
      }
    });

    $drawingArea.delegate( ".node-container a", "click", function(e) {
      e.stopPropagation();
    });

    $drawingArea.delegate( ".node-container #closeCross", "click", function(e) {
      e.stopPropagation();
    });

    $drawingArea.delegate( ".node-container #comment", "mousedown", function(e) {
      e.stopPropagation();
    });




    $drawingArea.delegate("div.node-caption", "mouseup", function(e) {
      var node = $(this).parent().data("node");
      if (self.nodeMouseUp) {
        self.nodeMouseUp(node);
      }
    });






    $drawingArea.delegate("div.node-caption", "dblclick", function(e) {
      var node = $(this).parent().data("node");
      if (self.nodeDoubleClicked) {
        self.nodeDoubleClicked(node);
      }
    });

    $drawingArea.delegate(".node-container #comment", "dblclick", function(e) {
      console.log("CanvasView.js - delegate Comment");
      var node = $(this).parent().parent().parent().data("node");
      if (self.commentDoubleClicked) {
        self.commentDoubleClicked(node);
}
    });

    $drawingArea.delegate( ".node-caption img", "dblclick", function(e) {
      e.stopPropagation();
    });

    $drawingArea.delegate("div.node-container", "mouseover", function(e) {
      if (e.target === this) {
        var node = $(this).data("node");
        if (self.nodeMouseOver) {
          self.nodeMouseOver(node);
        }
      }
      return false;
    });

    $drawingArea.delegate("div.node-caption", "mouseover", function(e) {
      if (e.target === this) {
        var node = $(this).parent().data("node");
        if (self.nodeCaptionMouseOver) {
          self.nodeCaptionMouseOver(node);
        }
      }
      return false;
    });

    // mouse wheel listener
    this.$getContainer().bind("mousewheel", function(e, delta) {
      if (self.mouseWheeled) {
        self.mouseWheeled(delta);
      }
    });
  };

  /**
   * Clears the drawing area.
   */
  this.clear = function() {
    var drawingArea = this.$getDrawingArea();
    drawingArea.children().remove();
    drawingArea.width(0).height(0);
  };

  /**
   * Calculates the width of a branch for a node for the given depth
   *
   * @param {Integer} depth the depth of the node
   * @returns {Number}
   */
  this.getLineWidth = function(depth) {
    return mindmaps.CanvasDrawingUtil.getLineWidth(this.zoomFactor, depth);
  };

  /**
   * Draws the complete map onto the drawing area. This should only be called
   * once for a mind map.
   */
  this.drawMap = function(map) {
    var now = new Date().getTime();
    var $drawingArea = this.$getDrawingArea();

    // clear map first
    $drawingArea.children().remove();

    var root = map.root;

    // 1.5. do NOT detach for now since DIV dont have widths and heights,
    // and loading maps draws wrong canvases (or create nodes and then draw
    // canvases)

    var detach = false;
    if (detach) {
      // detach drawing area during map creation to avoid unnecessary DOM
      // repaint events. (binary7 is 3 times faster)
      var $parent = $drawingArea.parent();
      $drawingArea.detach();
      self.createNode(root, $drawingArea);
      $drawingArea.appendTo($parent);
    } else {
      self.createNode(root, $drawingArea);
    }

    console.debug("draw map ms: ", new Date().getTime() - now);
  };


  /**
   * creates a symbolic link between two nodes
   * @param {mindmaps.Node} [parent]  - non-optional, node from where the link is created
   * @param {mindmaps.Node} [node] - the targeted node
   */
  this.createLink = function (parent, node){
      var number = parent.getSymbolicLinks().length-1;
      var $canvasLink = $("<canvas/>", {
        id : "node-canvasLink-" + number + "-" + parent.id,
        "class" : "line-canvas"
      });

      var $parent = $getNode(parent);
      var $node = $getNode(node);
      var color = "#A9A9A9";

      var offsetX = node.getPosition().x - parent.getPosition().x;
      var offsetY = node.getPosition().y - parent.getPosition().y;

      drawLinkCanvas($canvasLink, offsetX, offsetY, $node, $parent);

      $canvasLink.appendTo($node);

  };

  /**
   * delete a symbolic link between two nodes
   * @param {Integer} [idNode] - non-Optional
   * @param {mindmaps.Node} [node]  - non-optional, node from where the link is created
   */
  this.deleteLink = function (idNode, node){
      var $canvas = $getLinkCanvas(node, idNode);
      $canvas.remove();
  };
  /**
   * delete a node's symbolic links
   * @param {mindmaps.Node} [node]  - non-optional, node from where the links are created
   */
  this.deleteAllLinks = function(node){
    if (node.getSymbolicLinks().length > 0){
      for (var i = 0; i < node.getSymbolicLinks().length; i++){
        this.deleteLink(i, node);
      }
    }
  }
  /**
   * Inserts a new node including all of its children into the DOM.
   *
   * @param {mindmaps.Node} node - The model of the node.
   * @param {jQuery} [$parent] - optional jquery parent object the new node is
   *            appended to. Usually the parent node. If argument is omitted,
   *            the getParent() method of the node is called to resolve the
   *            parent.
   * @param {Integer} [depth] - Optional. The depth of the tree relative to
   *            the root. If argument is omitted the getDepth() method of the
   *            node is called to resolve the depth.
   */
  this.createNode = function(node, $parent, depth) {
    var parent = node.getParent();
    var $parent = $parent || $getNode(parent);
    var depth = depth || node.getDepth();
    var offsetX = node.offset.x;
    var offsetY = node.offset.y;

    // div node container
    var $node = $("<div/>", {
      id : "node-" + node.id,
      "class" : "node-container"
    }).data({
      node : node
    }).css({
      "font-size" : node.text.font.size
    });
    $node.appendTo($parent);

    if (node.isRoot()) {
      var w = this.getLineWidth(depth);
      $node.css("border-bottom-width", w);
    }

    if (!node.isRoot()) {
      // draw border and position manually only non-root nodes
      var bThickness = this.getLineWidth(depth);
      var bColor = node.branchColor;
      var bb = bThickness + "px solid " + bColor;

      $node.css({
        left : this.zoomFactor * offsetX,
        top : this.zoomFactor * offsetY,
        "border-bottom" : bb
      });

      // node drag behaviour
      /**
       * Only attach the drag handler once we mouse over it. this speeds
       * up loading of big maps.
       */
      $node.one("mouseenter", function() {
        $node.draggable({
          // could be set
          // revert: true,
          // revertDuration: 0,
          handle : "div.node-caption:first",
          start : function() {
            nodeDragging = true;
          },
          drag : function(e, ui) {
            // reposition and draw canvas while dragging
            var offsetX = ui.position.left / self.zoomFactor;
            var offsetY = ui.position.top / self.zoomFactor;
            var color = node.branchColor;
            var $canvas = $getNodeCanvas(node);

            drawLineCanvas($canvas, depth, offsetX, offsetY, $node, $parent, color);

            // reposition and draw links canvases while dragging
            //TODO : simplifier avec mindmapsNodeMap & lui meme

            var root = node.getRoot();
            //if the node is "parent" of a symbolic link
            $parent = $getNode(node);
            node.getSymbolicLinks().forEach(function(child) {
                console.log("ding");
              $node = $getNode(child);
              $canvas = $getLinkCanvas(node, node.symbolicLink.indexOf(child));
              offsetX = child.getPosition().x - (ui.position.left / self.zoomFactor + node.getParent().getPosition().x / self.zoomFactor);
              offsetY = child.getPosition().y - (ui.position.top / self.zoomFactor + node.getParent().getPosition().y / self.zoomFactor);

              drawLinkCanvas($canvas, offsetX, offsetY, $node, $parent);
            });

            //if the node is "child" of a symbolic link
            $node = $getNode(node);
            if(root.includeSymbolicLink(node)){
              $parent = $getNode(root);
              $canvas = $getLinkCanvas(root, root.symbolicLink.indexOf(node));
              offsetX = (ui.position.left / self.zoomFactor + node.getParent().getPosition().x) - root.getPosition().x;
              offsetY = (ui.position.top / self.zoomFactor + node.getParent().getPosition().y) - root.getPosition().y;

              drawLinkCanvas($canvas, offsetX, offsetY, $node, $parent);
            }
            root.forEachDescendant(function(parent) {
              if(parent.includeSymbolicLink(node)){
                $parent = $getNode(parent);
                $canvas = $getLinkCanvas(parent, parent.symbolicLink.indexOf(node));
                offsetX = (ui.position.left / self.zoomFactor + node.getParent().getPosition().x) - parent.getPosition().x;
                offsetY = (ui.position.top / self.zoomFactor + node.getParent().getPosition().y) - parent.getPosition().y;

                drawLinkCanvas($canvas, offsetX, offsetY, $node, $parent);
              }
            });
            //redraw the child's node's symbolic links
            if (!node.isLeaf()){
              node.forEachDescendant(function(childNode){
                //if the node is "parent" of a symbolic link
                $parent = $getNode(childNode);
                childNode.getSymbolicLinks().forEach(function(child) {
                  if (!node.isDescendant(child)){
                    if (parent == node){
                        $childNode = $getNode(child);
                        $canvas = $getLinkCanvas(childNode, childNode.symbolicLink.indexOf(child));
                        offsetX = ((node.getPosition().x - childNode.getPosition().x) - (ui.position.left / self.zoomFactor)) + child.getPosition().x - node.getParent().getPosition().x;
                        offsetY = ((node.getPosition().y - childNode.getPosition().y) - (ui.position.top / self.zoomFactor)) + child.getPosition().y - node.getParent().getPosition().y;
                        drawLinkCanvas($canvas, offsetX, offsetY, $childNode, $parent);
                    } else {
                      $childNode = $getNode(child);
                      $canvas = $getLinkCanvas(childNode, childNode.symbolicLink.indexOf(child));
                      offsetX = ((node.getPosition().x - childNode.getPosition().x) - (ui.position.left / self.zoomFactor)) + child.getPosition().x - node.getParent().getPosition().x;
                      offsetY = ((node.getPosition().y - childNode.getPosition().y) - (ui.position.top / self.zoomFactor)) + child.getPosition().y - node.getParent().getPosition().y;
                      drawLinkCanvas($canvas, offsetX, offsetY, $childNode, $parent);
                    }
                  }
                });

                //if the node is "child" of a symbolic link
                $childNode = $getNode(childNode);
                if(root.includeSymbolicLink(childNode)){
                  $parent = $getNode(root);
                  $canvas = $getLinkCanvas(root, root.symbolicLink.indexOf(childNode));
                  offsetX = ((ui.position.left / self.zoomFactor) - (node.getPosition().x - childNode.getPosition().x)) - root.getPosition().x + node.getParent().getPosition().x;
                  offsetY = ((ui.position.top / self.zoomFactor) - (node.getPosition().y - childNode.getPosition().y)) - root.getPosition().y + node.getParent().getPosition().y;

                  drawLinkCanvas($canvas, offsetX, offsetY, $node, $parent);
                }
                root.forEachDescendant(function(parent) {
                  if(parent.includeSymbolicLink(childNode) && !node.isDescendant(parent)){
                    if (parent == node){
                      $parent = $getNode(parent);
                      $canvas = $getLinkCanvas(parent, parent.symbolicLink.indexOf(childNode));
                      offsetX = ((ui.position.left / self.zoomFactor) - (node.getPosition().x - childNode.getPosition().x)) - ui.position.left + node.getParent().getPosition().x;
                      offsetY = ((ui.position.top / self.zoomFactor) - (node.getPosition().y - childNode.getPosition().y)) - ui.position.top + node.getParent().getPosition().y;
                      drawLinkCanvas($canvas, offsetX, offsetY, $childNode, $parent);
                    } else {
                      $parent = $getNode(parent);
                      $canvas = $getLinkCanvas(parent, parent.symbolicLink.indexOf(childNode));
                      offsetX = ((ui.position.left / self.zoomFactor) - (node.getPosition().x - childNode.getPosition().x)) - parent.getPosition().x + node.getParent().getPosition().x;
                      offsetY = ((ui.position.top / self.zoomFactor) - (node.getPosition().y - childNode.getPosition().y)) - parent.getPosition().y + node.getParent().getPosition().y;
                      drawLinkCanvas($canvas, offsetX, offsetY, $childNode, $parent);
                    }
                  }
                });
              });
            }

            // fire dragging event
            if (self.nodeDragging) {
              self.nodeDragging();
            }
          },
          stop : function(e, ui) {
            nodeDragging = false;
            var pos = new mindmaps.Point(ui.position.left
                / self.zoomFactor, ui.position.top
                / self.zoomFactor);

            // fire dragged event
            if (self.nodeDragged) {
              self.nodeDragged(node, pos);
            }
          }
        });
      });
    }
console.log($node);
    // text caption
    var font = node.text.font;
    var $text = $("<div/>", {
      id : "node-caption-" + node.id,
      "class" : "node-caption node-text-behaviour",
      text : node.text.caption
    }).css({
      "color" : font.color,
      "font-size" : this.zoomFactor * 100 + "%",
      "font-weight" : font.weight,
      "font-style" : font.style,
      "text-decoration" : font.decoration
    }).appendTo($node);
    //$('<a href="http://www.google.fr">C\'est oim</a>').appendTo($node);



    // text caption
/*
    var font2 = node.commentary.font;
    var $text2 = $("<div/>", {
      id : "node-caption-" + node.id,
      "class" : "node-description",
      text : node.commentary.des
    }).css({
      "color" : font2.color,
      "font-size" : this.zoomFactor * 100 + "%",
      "font-weight" : font2.weight,
      "font-style" : font2.style,
      "text-decoration" : font2.decoration
    }).appendTo($node);
*/

    var metrics = textMetrics.getTextMetrics(node, this.zoomFactor);
    $text.css(metrics);

    // create fold button for parent if he hasn't one already
    var parentAlreadyHasFoldButton = $parent.data("foldButton");
    var nodeOrParentIsRoot = node.isRoot() || parent.isRoot();
    if (!parentAlreadyHasFoldButton && !nodeOrParentIsRoot) {
      this.createFoldButton(parent);
    }

    if (!node.isRoot()) {
      // toggle visibility
      if (parent.foldChildren) {
        $node.hide();
      } else {
        $node.show();
      }

      // draw canvas to parent if node is not a root
      var $canvas = $("<canvas/>", {
        id : "node-canvas-" + node.id,
        "class" : "line-canvas"
      });

      // position and draw connection
      drawLineCanvas($canvas, depth, offsetX, offsetY, $node, $parent, node.branchColor);
      $canvas.appendTo($node);
    }

    if (node.isRoot()) {
      $node.children().andSelf().addClass("root");
    }

    // draw child nodes
    node.forEachChild(function(child) {
      self.createNode(child, $node, depth + 1);
    });
  };

  /**
   * Removes a node from the view and with it all its children and the branch
   * leading to the parent.
   *
   * @param {mindmaps.Node} node
   */
  this.deleteNode = function(node) {
    // detach creator first, we need still him
    // creator.detach();

    // delete all DOM below
    var $node = $getNode(node);
    $node.remove();

  };

  /**
   * Highlights a node to show that it is selected.
   *
   * @param {mindmaps.Node} node
   */
  this.highlightNode = function(node) {
    var $text = $getNodeCaption(node);
    //alert("Coucou toi, Kévin !");
    $text.addClass("selected");
  };
/*  /**
   * Highlights a node to show that it is selected.
   *
   * @param {mindmaps.Node} node
   */
  this.afficherDescription = function(node) {
    // text caption
/*
    console.log("avDeleteNodeCommand");
    deleteNodeCommand.setEnabled(false);
    console.log("apDeleteNodeCommand");
*/
    var font2 = node.comment.font;
    var $text2 = $("<div/>", {
      id : "node-div-" + node.id,
      "class" : "ui-widget ui-corner-all ui-widget-content"
    }).css({
      "color" : font2.color,
      "width" : "220px",
      "height" : "auto",
      "font-size" : this.zoomFactor * 100 + "%",
      "font-weight" : font2.weight,
      //"background-color" : "red",
      "z-index" : "3",
      "display" : "none",
      "position" : "relative",
      "top" : "-25px",
      "right" : "240px",
      //"font-style" : font2.style,
      "text-decoration" : font2.decoration
    }).appendTo($getNode(node));


    var c = $text2.attr("width");

    $("#node-div-"+node.id).append('<div id="barre" class="ui-dialog-titlebar ui-widget-header">Options</div>');
    $("#node-div-"+node.id).append('<div id="contenu" class="ui-dialog-content ui-widget-content"></div>');
    //ui-widget ui-dialog ui-corner-all ui-widget-content
    //$("#node-div-"+node.id).append('<p class="ui-widget ui-dialog ui-corner-all ui-widget-content">YOYOYOYO</p>');

    var commentaire = node.getComment();

/*
    $("#node-div-"+node.id).append('<label class="switch" id="s1" style="position:absolute;right:0;"><input type="checkbox" id="myCheckComment"><span class="slider round"></span></label>');
    $('<textarea id="textareaComment" style="display:none;">'+commentaire+'</textarea>').insertAfter($('#s1'));
    $('<p id="comment">'+commentaire+'</p>').insertAfter($('#s1'));
*/

    var $divContain = $("<div/>", {
      "id" : "contain"
    }).css({
      //"vertical-align" : "middle",
      //"display" : "table-cell",
      "line-height" : "20px",
      "width" : "220px",
      "margin-top" : "5%"
      //"height" : "22.5px"
    }).appendTo($('#contenu'));


    var $descrip = $("<label>", {
      "id" : "descrip",
      //"for" : "textareaComment",
      text : "Commentaire"
    }).css({
      "vertical-align" : "middle",
      "font-weight" : "bold",
      "padding-left" : "10px"
    }).appendTo($('#contain'));

    var $comment = $("<p>", {
      "id" : "comment",
      "text" : commentaire
      //"contenteditable" : "true"
    }).css({
      "margin-top" : "3.5%",
      "margin-left" : "10px",
      "border" : "1px",
      "border-style" : "dotted",
      "width" : "190px",
      "height" : "43px"
    }).insertAfter($divContain);

    var url = node.getURL();







    var $divContainLink = $("<div/>", {
      "id" : "containLink"
    }).css({
      //"vertical-align" : "middle",
      //"display" : "table-cell",
      "line-height" : "20px",
      "width" : "220px",
      "margin-top" : "7%"
      //"height" : "22.5px"
    }).appendTo($('#contenu'));


    var $url = $("<label>", {
      "id" : "url",
      //"for" : "textareaComment",
      text : "Lien URL"
    }).css({
      "vertical-align" : "middle",
      "font-weight" : "bold",
      "padding-left" : "10px"
    }).appendTo($('#containLink'));


    var $labelToggleSwitch2 = $("<label>", {
      "id" : "s2",
      "class" : "switch"
    }).css({
      "position" : "absolute",
      "right" : "10px"
    }).appendTo($('#containLink'));


    var $inputToggleSwitch2 = $('<input>', {
      id : "myCheckLink",
      "type" : "checkbox"
    }).appendTo($labelToggleSwitch2);


    var $spanToggleSwitch2 = $('<span>', {
      "class" : "slider round"
    }).insertAfter($inputToggleSwitch2);

    var $inputLink = $("<input/>", {
      "id" : "inputLink",
      "type" : "text",
      "value" : url
    }).css({
      "display" : "none",
      "margin-top" : "3.5%",
      "width" : "135px",
      "height" : "20px",
      "margin-left" : "10px"
    }).insertAfter($divContainLink);

    var $labelInputLink = $("<label/>", {
      "for" : "inputLink",
      "id" : "labelInputLink",
      "text" : "http://"
    }).css({
      "display" : "none",
      "margin-top" : "3.5%",

      "margin-left" : "10px"
    }).insertAfter($divContainLink);


    var $linkContainer = $("<a>", {
      "id" : "linkContainer",
      "href" : "http://"+node.getURL(),
      "target" : "_blank",
      "vertical-align" : "middle"
    }).css({
      /*
      "margin-top" : "3.5%",
      "margin-left" : "10px",
      "border" : "1px",
      "border-style" : "dotted",
      "width" : "190px",
      "height" : "27px"
      */
    }).insertAfter($divContainLink);

    var $realLink = $("<p>", {
      "id" : "realLink",
      "text" : node.getURL()
    }).css({
      "margin-top" : "3.5%",
      "margin-left" : "10px",
      //"border" : "1px",
      //"border-style" : "dotted",
      "width" : "190px",
      "height" : "27px"
    }).appendTo($linkContainer);



/*
    $("#contenu").append('<label class="switch" id="s2" style="position:absolute;right:0;"><input type="checkbox" id="myCheckLink"><span class="slider round"></span></label>');
    $('<input type="text" id="inputLink" style="display:none;" value="'+url+'"></input>').insertAfter($('#s2'));
    $('<a id="realLink" class="link" href="http://'+url+'" target="_blank">'+url+'</a>').insertAfter($('#s2'));
*/
    //use specific icon, created by the author
    $("#barre").prepend('<span id="closeCross" class="icon-click" style="position:absolute;right:0;">&#x1f5d9;</span>');

    //$("#node-div-"+node.id).append('<input type="checkbox" id="myCheck">');
    // $("#node-div-"+node.id).append('<p id="fieldLink"></p>');


    $("#contenu").append('<label for="exploFile" id="labelExploFile" class="ui-button ui-widget ui-state-default ui-corner-all">Choisir une image</label><input id="exploFile" class="input-file" type="file" style="display:none;">');

    //$("#contenu").append('<input type="file" id="exploFile" class="ui-button ui-widget ui-state-default ui-corner-all">');

    //$("#node-div-"+node.id).append('<img id="image" src="#" alt="your image" />');


    //var t = "button-"+node.id;
    //var d = "divi-"+node.id;

/*
    var element = document.getElementById('yoyo');

    element.addEventListener('click', function(e) {
      //e.preventDefault();

      if (element.isContentEditable) {
        // Disable Editing
        element.contentEditable = 'false';

        // You could save any changes here.
      } else {
        element.contentEditable = 'true';
      }
    });

    */

    var img = document.createElement("img");
    var src = document.getElementById("node-caption-" + node.id);
    img.src = "../img/icon.jpg";
    img.width = "10";
    img.id = node.id+"-img";

    src.appendChild(img);

    //var element = document.getElementById(node.id+"-img");

    //console.log("Avant ContentEditable");
    //$("<p>This is an editable paragraph.</p>").insertAfter("node-description-"+node.id);
    //document.getElementById("node-caption-" + node.id).contentEditable = "false";

    //$("img").after("<p>Hello world!</p>");

    //$('node-caption-'+node.id).after('<p>wouwou</p>');
    //console.log('node-caption-'+node.id);

    //user click on the icon of the node

      // $('#'+node.id+"-img").click(/*function(){
      //   $('#node-div-'+node.id).slideToggle("fast");
      //   //console.log("Avant RedrawConnectors");
      //   //view.redrawNodeConnectors(node);
      //   $(document).redrawNodeConnectors(node);
      // }*/view.redrawNodeConnectors(node));

      $('#'+node.id+"-img").click(function(){
        $('#node-div-'+node.id).slideToggle("fast");
      });
this.redrawNodeConnectors(node);





    $('#myCheckComment').click(function(){
      var stateCheck = document.getElementById("myCheckComment").checked;
      var com = node.getComment();

      if(stateCheck === true){
        document.getElementById("textareaComment").value = com;
        $('#textareaComment').toggle();
        $('#comment').toggle();
      }else{
        var textAreaValue = document.getElementById("textareaComment").value;
        node.setComment(textAreaValue);
        $('#comment').text(textAreaValue);
        $('#textareaComment').toggle();
        $('#comment').toggle();
      }

    });



     $('#myCheckLink').click(function(){
       var stateCheck = document.getElementById("myCheckLink").checked;
       var url = node.getURL();

       if(stateCheck === true){
         document.getElementById("inputLink").value = url;
         $('#labelInputLink').toggle();
         $('#inputLink').toggle();
         $('#realLink').toggle();
         console.log("URL1 : "+node.getURL());
       }else{
         $('#labelInputLink').toggle();
         $('#inputLink').toggle();
         $('#realLink').toggle();
         var fieldValue = document.getElementById("inputLink").value;
         node.setURL(fieldValue);
         $('#realLink').text(fieldValue);
         $('#linkContainer').attr("href","http://"+node.getURL()+"/");


         console.log("URL2 : "+node.getURL());
       }
     });
     //
     // $('#exploFile').change(function(){
     //   /*
     //   var element = document.getElementById('exploFile');
     //   var path = element.value;
     //   $("#node-div-"+node.id).append('<img src="'+path+'">');
     //   */
     //
     //   if ($('#exploFile').files && $('#exploFile').files[0]) {
     //   var reader = new FileReader();
     //   reader.onload = function (e) {
     //       $('#image')
     //           .attr('src', e.target.result)
     //           .width(150)
     //           .height(200);
     //         };
     //         reader.readAsDataURL(input.files[0]);
     //    }
     //  });

var img = document.createElement("img");//$("#node-div-"+node.id).attr('contentEditable',true);
img.id="allo";
img.width="220px";
img.height="auto";

var $imageExplorer = $("<img>", {
  "id" : "allo",
  "width" : "220px",
  "height" : "auto"
}).insertAfter($('#contenu'));

// // $('#allo').css({
// //    "width" : "220px",
// //    "height" : 'auto'
// // });
//
// $("#contenu").after(img);

var divDiag = document.createElement("div");
divDiag.id="divDiag";
divDiag.title = "Image sélectionnée";


//$('#divDiag').text("Remove");

var form = document.createElement("form");






//$('#divDiag').append('<div> S a l u t </div>');
//$('#allo').resizable();
$('#allo').after(divDiag);

$('#exploFile').change(function() {

  var src = $('#allo').attr('src');
  var imgDialog = document.createElement("img");
  imgDialog.id = "imgDialog";

  var x = document.getElementById("exploFile");

  if (x.files && x.files[0]) {
    var reader = new FileReader();

    reader.onload = function(e) {
      $('#imgDialog').attr('width', "350px");
      $('#imgDialog').attr('height', 'auto');
      $('#imgDialog').attr('src', e.target.result);
    }

    reader.readAsDataURL(x.files[0]);
    $('#divDiag').append(imgDialog);
  }

});

  $('#contenu').append('<button class="ui-button ui-widget ui-state-default ui-corner-all" id="opener">Open Dialog</button>');

     $('#exploFile').change(function() {
       var x = document.getElementById("exploFile");
       if (x.files && x.files[0]) {
         var reader = new FileReader();
         reader.onload = function(e) {
           $('#allo').attr('src', e.target.result);
         }
         reader.readAsDataURL(x.files[0]);
       }
     });

     $('#divDiag').dialog({autoOpen: false,});
     $('#opener').click(function(){
       //$('#divDiag').append("Remove");
       $('#divDiag').dialog("open");
     });



/*
     $("#exploFile").change(function(e) {

    //for (var i = 0; i < e.originalEvent.srcElement.files.length; i++) {

        var file = e.originalEvent.srcElement.files[0];

        var img = document.createElement("img");
        var reader = new FileReader();
        reader.onloadend = function() {
             img.src = reader.result;
        }
        reader.readAsDataURL(file);
        $("#exploFile").after(img);


        var divClickDialog = document.createElement("div");
        divClickDialog.id = "clickDialog";
        divClickDialog.title = "Hello c'est moi";
        $('#clickDialog').text("Yoyoyoyo");
        $("#exploFile").after(divClickDialog);

  //  }
});
*/
    //
    // $('#myCheckLink').click(function(){
    //
    //   var x = document.getElementById("myCheckLink").checked;
    //   console.log("non click");
    //   if(x === true){
    //     var contentField = document.getElementById("fieldLink").text;
    //       $('#fieldLink').remove();
    //       $('#icon-link').remove();
    //       $("#node-div-"+node.id).append('<textarea id="textareaLink">'+contentField+'</textarea>');
    //       document.getElementById("textareaLink").value = contentField;
    //
    //   }else{
    //     var contentTextArea = document.getElementById("textareaLink").value;
    //     $('#textareaLink').remove();
    //     //$("#node-div-"+node.id).append('<a id="fieldLink" href="http://'+contentTextArea+'" onclick="window.open(\'https://www.google.fr\')">'+contentTextArea+'</a>');
    //     //$('<a href="http://www.google.fr">C\'est oim</a>').appendTo($("#node-div-"+node.id));
    //     $("#node-div-"+node.id).append('<span><a id="fieldLink" class="link" href="https://'+contentTextArea+'" target="_blank">'+contentTextArea+'</a></span><span id="icon-link" class="ui-button-icon-primary ui-icon ui-icon-extlink"></span><span>ALLO</span>');
    //     //window.open('http://www.google.fr', '_blank');
    //
    //     /*$('#fieldLink').bind('click', function(e) {
    //
    //     });*/
    //     //var str = "Free Web Building Tutorials!";
    //     //var result = contentTextArea.link(contentTextArea);
    //     //document.getElementById("fieldLink").innerHTML = result;
    //     //document.getElementById("fieldLink").value = contentTextArea;
    //   }
    //   //$('<div style="background-color:#0F0">c esst moi mdrrr</div>').insertAfter('#node-'+node.id);
    //   //console.log("Vous m'avez cliqué");
    // });


    $('#closeCross').click(function(){

      //var x = document.getElementById("myCheckComment").checked;
      //var y = document.getElementById("myCheckLink").checked;
      var testErrorText = document.getElementById('texte');
      console.log("click de la croix");
      //if(x === false && y=== false){
        console.log("click de la croix - remove");
        $('#node-div-'+node.id).slideToggle("fast");
        //$('#node-div-'+node.id).remove();
      //}else{
        //console.log("click de la croix - message");

          //$('#node-div-'+node.id).append('<p id="texte">Veuillez bloquer tous les champs.</p>');


    });





/*
    "#node-description-" + node.id;
    des = "node-description-" + node.id;
    console.log(des);
*/
    //console.log(nodeId);
    /*
    var description = document.getElementById(des);
    description.setAttribute("contenteditable","true");
    */
  };



  /**
   * Highlights a node to show that it is selected.
   *
   * @param {mindmaps.Node} node
   */

  this.enleverDescription = function(node) {
    // text caption
    //console.log("CanvasView.enleverDescription ");
    var element = document.getElementById(node.id+"-img");
    var font2 = node.comment.font;

    $('#'+node.id+'-img').remove();
    $('#node-div-'+node.id).remove();

  };


  /**
   * Removes the hightlight of a node.
   *
   * @param {mindmaps.Node} node
   */
  this.unhighlightNode = function(node) {
    var $text = $getNodeCaption(node);
    $text.removeClass("selected");
  };

  /**
   * Hides all children of a node.
   *
   * @param {mindmaps.Node} node
   */
  this.closeNode = function(node) {
    var $node = $getNode(node);
    $node.children(".node-container").hide();

    var $foldButton = $node.children(".button-fold").first();
    $foldButton.removeClass("open").addClass("closed");
  };

  /**
   * Shows all children of a node.
   *
   * @param {mindmaps.Node} node
   */
  this.openNode = function(node) {
    var $node = $getNode(node);
    $node.children(".node-container").show();

    var $foldButton = $node.children(".button-fold").first();
    $foldButton.removeClass("closed").addClass("open");
  };

  /**
   * Creates the fold button for a node that shows/hides its children.
   *
   * @param {mindmaps.Node} node
   */
  this.createFoldButton = function(node) {
    var position = node.offset.x > 0 ? " right" : " left";
    var openClosed = node.foldChildren ? " closed" : " open";
    var $foldButton = $("<div/>", {
      "class" : "button-fold no-select" + openClosed + position
    }).click(function(e) {
      // fire event
      if (self.foldButtonClicked) {
        self.foldButtonClicked(node);
      }

      e.preventDefault();
      return false;
    });

    // remember that foldButton was set and attach to node
    var $node = $getNode(node);
    $node.data({
      foldButton : true
    }).append($foldButton);
  };

  /**
   * Removes the fold button.
   *
   * @param {mindmaps.Node} node
   */
  this.removeFoldButton = function(node) {
    var $node = $getNode(node);
    $node.data({
      foldButton : false
    }).children(".button-fold").remove();
  };

  /**
   * Goes into edit mode for a node.
   *
   * @param {mindmaps.Node} node
   */
  this.editNodeCaption = function(node) {
    captionEditor.edit(node, this.$getDrawingArea());
  };

  /**
   * Goes into edit mode for a node.
   *
   * @param {mindmaps.Node} node
   */
  this.editNodeComment = function(node) {
    console.log("CanvasView.js - editNodeComment");
    commentEditor.edit(node, this.$getDrawingArea());
  };

  /**
   * Stops the current edit mode.
   */
  this.stopEditNodeCaption = function() {
    captionEditor.stop();
  };

  this.stopEditNodeComment = function() {
    console.log("CanvasView.js - stopEditNodeComment");
    commentEditor.stop();
  };


  /**
   * Updates the text caption for a node.
   *
   * @param {mindmaps.Node} node
   * @param {String} value
   */
  this.setNodeText = function(node, value) {
    var $text = $getNodeCaption(node);
    var metrics = textMetrics.getTextMetrics(node, this.zoomFactor, value);
    $text.css(metrics).text(value);

  };

  this.setCommentText = function(node, value) {
    console.log("CanvasView.js - setCommentText()");
    var $comment = $getNodeDescription(node);
    //var metrics = textMetrics.getTextMetrics(node, this.zoomFactor, value);
    //console.log("valeur1 = "+value);
    value = value.replace(/\n/g, '<br />');
    $comment.html(value);
    //console.log("valeur2 = "+value);
    //css(metrics)
  };

  /**
   * Get a reference to the creator tool.
   *
   * @returns {Creator}
   */
  this.getCreator = function() {
    return creator;
  };

  /**
   * Returns whether a node is currently being dragged.
   *
   * @returns {Boolean}
   */
  this.isNodeDragging = function() {
    return nodeDragging;
  };

  /**
   * Redraws a node's branch to its parent.
   *
   * @param {mindmaps.Node} node
   * @param {String} optional color
   */
  function drawNodeCanvas(node, color) {
    var parent = node.getParent();
    var depth = node.getDepth();
    var offsetX = node.offset.x;
    var offsetY = node.offset.y;
    color = color || node.branchColor;

    var $node = $getNode(node);
    var $parent = $getNode(parent);
    var $canvas = $getNodeCanvas(node);

    drawLineCanvas($canvas, depth, offsetX, offsetY, $node, $parent, color);
  }

  /**
   * Redraws a node's symbolic links.
   *
   * @param {mindmaps.Node} node
   * @param {String} optional color
   */
  function drawSymbolicLinkCanvas(node, color) {
    color = color || node.branchColor;
    var symbolicLink = node.symbolicLink;

  //s'il est "parent" d'autres noeuds
    $parent = $getNode(node);

    for (var i = 0; i < symbolicLink.length; i++){
      $canvas = $getLinkCanvas(node, i);
      $node = $getNode(symbolicLink[i]);

      var offsetX = symbolicLink[i].getPosition().x - node.getPosition().x;
      var offsetY = symbolicLink[i].getPosition().y - node.getPosition().y;

      drawLinkCanvas($canvas, offsetX, offsetY, $node, $parent);
    }
  }

  /**
   * Redraws all branches that a node is connected to.
   *
   * @param {mindmaps.Node} node
   */
  this.redrawNodeConnectors = function(node) {
    // redraw canvas to parent
    if (!node.isRoot()) {
      drawNodeCanvas(node);
    }

    // redraw all child canvases
    if (!node.isLeaf()) {
      node.forEachChild(function(child) {
        drawNodeCanvas(child);
      });
    }

    // redraw all link canvases
    drawSymbolicLinkCanvas(node);

  };

  /**
   * Changes only the color of the branch leading up to it's parent.
   */
  this.updateBranchColor = function(node, color) {
    var $node = $getNode(node);
    $node.css("border-bottom-color", color);

    // redraw canvas to parent
    if (!node.isRoot()) {
      drawNodeCanvas(node, color);
    }
  };

  /**
   * Changes only the font color of a node.
   */
  this.updateFontColor = function(node, color) {
    var $text = $getNodeCaption(node);
    $text.css("color", color);
  };

  /**
   * Does a complete visual update of a node to reflect all of its attributes.
   *
   * @param {mindmaps.Node} node
   */
  this.updateNode = function(node) {
    var $node = $getNode(node);
    var $text = $getNodeCaption(node);
    var font = node.text.font;
    $node.css({
      "font-size" : font.size,
      "border-bottom-color" : node.branchColor
    });

    var metrics = textMetrics.getTextMetrics(node, this.zoomFactor);

    $text.css({
      "color" : font.color,
      "font-weight" : font.weight,
      "font-style" : font.style,
      "text-decoration" : font.decoration
    }).css(metrics);

    this.redrawNodeConnectors(node);
  };

  /**
   * Moves the node a new position.
   *
   * @param {mindmaps.Node} node
   */
  this.positionNode = function(node) {
    var $node = $getNode(node);
    // TODO try animate
    // position
    $node.css({
      left : this.zoomFactor * node.offset.x,
      top : this.zoomFactor * node.offset.y
    });

    // redraw canvases to parent
    this.redrawNodeConnectors(node);
  };

  /**
   * Redraws the complete map to adapt to a new zoom factor.
   */
  this.scaleMap = function() {
    var zoomFactor = this.zoomFactor;
    var $root = this.$getDrawingArea().children().first();
    var root = $root.data("node");

    var w = this.getLineWidth(0);
    $root.css("border-bottom-width", w);

    // handle root differently
    var $text = $getNodeCaption(root);
    var metrics = textMetrics.getTextMetrics(root, this.zoomFactor);
    $text.css(
        {
          "font-size" : zoomFactor * 100 + "%",
          "left" : zoomFactor
              * -mindmaps.TextMetrics.ROOT_CAPTION_MIN_WIDTH / 2
        }).css(metrics);

    root.forEachChild(function(child) {
      scale(child, 1);
    });

    function scale(node, depth) {
      var $node = $getNode(node);

      // draw border and position manually
      var bWidth = self.getLineWidth(depth);

      $node.css({
        left : zoomFactor * node.offset.x,
        top : zoomFactor * node.offset.y,
        "border-bottom-width" : bWidth
      });

      var $text = $getNodeCaption(node);
      $text.css({
        "font-size" : zoomFactor * 100 + "%"
      });

      var metrics = textMetrics.getTextMetrics(node, self.zoomFactor);
      $text.css(metrics);

      // redraw canvas to parent
      drawNodeCanvas(node);

      // redraw all child canvases
      if (!node.isLeaf()) {
        node.forEachChild(function(child) {
          scale(child, depth + 1);
        });
      }

      // redraw all symbolicLink
      drawSymbolicLinkCanvas(node);

    }
  };

  /**
   * Creates a new CaptionEditor. This tool offers an inline editor component
   * to change a node's caption.
   *
   * @constructor
   * @param {mindmaps.CanvasView} view
   */
  function CaptionEditor(view) {
    var self = this;
    var attached = false;


    // text input for node edits.
    var $editor = $("<textarea/>", {
      id : "caption-editor"
      //"class" : "node-text-behaviour"
    }).bind("keydown", "esc", function() {
      self.stop();
    }).bind("keydown", "return", function() {
      commitText();
      alignBranches();
    }).mousedown(function(e) {
      // avoid premature canceling
      e.stopPropagation();
    }).blur(function() {
      commitText();
    }).bind(
        "input",
        function() {

          var metrics = textMetrics.getTextMetrics(self.node,
              view.zoomFactor, $editor.val());

          $editor.css(metrics);
          alignBranches();
        });

    function commitText() {
      if (attached && self.commit) {
        self.commit(self.node, $editor.val());
      }
    }

    function alignBranches() {
      // slightly defer execution for better performance on slow
      // browsers
      setTimeout(function() {
        view.redrawNodeConnectors(self.node);
      }, 1);
    }

    /**
     * Attaches the textarea to the node and temporarily removes the
     * original node caption.
     *
     * @param {mindmaps.Node} node
     * @param {jQuery} $cancelArea
     */
    this.edit = function(node, $cancelArea) {

      if (attached) {
        return;
      }
      this.node = node;
      attached = true;

      // TODO put text into span and hide()
      this.$text = $getNodeCaption(node);
      this.$cancelArea = $cancelArea;

      this.text = this.$text.text();

      this.$text.css({
        width : "auto",
        height : "auto"
      }).empty().addClass("edit");

      // jquery ui prevents blur() event from happening when dragging a
      // draggable. need this
      // workaround to detect click on other draggable
      $cancelArea.bind("mousedown.editNodeCaption", function(e) {
        commitText();
      });

      var metrics = textMetrics.getTextMetrics(self.node,
          view.zoomFactor, this.text);

      $editor.attr({
        value : this.text
      }).css(metrics).appendTo(this.$text).select();

    };

    /**
     * Removes the editor from the node and restores its old text value.
     */
    this.stop = function() {
      if (attached) {
        attached = false;
        this.$text.removeClass("edit");
        $editor.detach();

        this.$cancelArea.unbind("mousedown.editNodeCaption");

        view.setNodeText(this.node, this.text);
        alignBranches();

      }
    };
  }



    /**
     * Creates a new CommentEditor. This tool offers an inline editor component
     * to change a node's caption.
     *
     * @constructor
     * @param {mindmaps.CanvasView} view
     */
    function CommentEditor(view) {
      var self = this;
      var attached = false;

      console.log("CommentEditor");


      // text input for node edits.
      var $editor = $("<textarea/>", {
        id : "comment-editor",
        "class" : "node-text-behaviour"
      }).css({
        "width" : "250",
        "height" : "25"
      }).bind("keydown", "esc", function() {
        console.log("CanvasView.js - Touche ESC");
        self.stop();
      }).bind("keydown", "return", function() {
        console.log("CanvasView.js - Touche ENTREE");
        commitText();
        alignBranches();
      }).bind("keydown","ctrl+return",function (e) {
        $editor.val(function(i,val){

          return val + "\n";
      });
      //commitText();
      console.log("CanvasView.js - Touche CTRL+ENTREE");

      }).mousedown(function(e) {
        // avoid premature canceling
        e.stopPropagation();
      }).blur(function(e) {
        //e.stopPropagation();
        commitText();
      }).bind(
          "input",
          function() {
            console.log("CanvasView.js - INPUT");
            var metrics = textMetrics.getTextMetrics(self.node,
                view.zoomFactor, $editor.val());
            $editor.css(metrics);
            alignBranches();
          });

      function commitText() {
        if (attached && self.commit1) {
          self.commit1(self.node, $editor.val());
        }
      }

      function alignBranches() {
        // slightly defer execution for better performance on slow
        // browsers
        setTimeout(function() {
          view.redrawNodeConnectors(self.node);
        }, 1);
      }

      /**
       * Attaches the textarea to the node and temporarily removes the
       * original node caption.
       *
       * @param {mindmaps.Node} node
       * @param {jQuery} $cancelArea
       */
      this.edit = function(node, $cancelArea) {
        console.log("CanvasView - Edit (1)");

        if (attached) {
          return;
        }
        this.node = node;
        attached = true;



        // TODO put text into span and hide()
        this.$text = $getNodeDescription(node);
        this.$cancelArea = $cancelArea;
        var regex = /<br\s*[\/]?>/gi;

        this.text = this.$text.html().replace(regex,"\n");

        this.$text.css({
          width : "auto",
          height : "auto"
        }).empty().addClass("edit");
        // jquery ui prevents blur() event from happening when dragging a
        // draggable. need this
        // workaround to detect click on other draggable
        $cancelArea.bind("mousedown.editNodeComment", function(e) {
          console.log("CanvasView - Edit bind (2)");
          commitText();
        });

        /*var metrics = textMetrics.getTextMetrics(self.node,
            view.zoomFactor, this.text);*/

        $editor.attr({
          value : this.text
        }).insertAfter(this.$text).select();
/*css(metrics).*/
      };

      /**
       * Removes the editor from the node and restores its old text value.
       */
      this.stop = function() {
        console.log("CanvasView - stop (2)");
        if (attached) {
          attached = false;
          this.$text.removeClass("edit");
          $editor.detach();
          this.$cancelArea.unbind("mousedown.editNodeComment");
          view.setCommentText(this.node, this.text);

          alignBranches();
        }
      };
    }


  /**
   * Creates a new Creator. This tool is used to drag out new branches to
   * create new nodes.
   *
   * @constructor
   * @param {mindmaps.CanvasView} view
   * @returns {Creator}
   */
  function Creator(view) {
    var self = this;
    var dragging = false;

    this.node = null;
    this.lineColor = null;

    var $wrapper = $("<div/>", {
      id : "creator-wrapper"
    }).bind("remove", function(e) {
      // detach the creator when some removed the node or opened a new map
      self.detach();
      // and avoid removing from DOM
      e.stopImmediatePropagation();

      return false;
    });

    // red dot creator element
    var $nub = $("<div/>", {
      id : "creator-nub"
    }).appendTo($wrapper);

    var $fakeNode = $("<div/>", {
      id : "creator-fakenode"
    }).appendTo($nub);

    // canvas used by the creator tool to draw new lines
    var $canvas = $("<canvas/>", {
      id : "creator-canvas",
      "class" : "line-canvas"
    }).hide().appendTo($wrapper);

    // make it draggable
    $wrapper.draggable({
      revert : true,
      revertDuration : 0,
      start : function() {
        dragging = true;
        // show creator canvas
        $canvas.show();
        if (self.dragStarted) {
          self.lineColor = self.dragStarted(self.node);
        }
      },
      drag : function(e, ui) {
        // update creator canvas
        var offsetX = ui.position.left / view.zoomFactor;
        var offsetY = ui.position.top / view.zoomFactor;

        // set depth+1 because we are drawing the canvas for the child
        var $node = $getNode(self.node);
        drawLineCanvas($canvas, self.depth + 1, offsetX, offsetY,
            $fakeNode, $node, self.lineColor);
      },
      stop : function(e, ui) {
        dragging = false;
        // remove creator canvas, gets replaced by real canvas
        $canvas.hide();
        if (self.dragStopped) {
          var $wp = $wrapper.position();
          var $wpLeft = $wp.left / view.zoomFactor;
          var $wpTop = $wp.top / view.zoomFactor;
          var nubLeft = ui.position.left / view.zoomFactor;
          var nubTop = ui.position.top / view.zoomFactor;

          var distance = mindmaps.Util.distance($wpLeft - nubLeft,
              $wpTop - nubTop);
          self.dragStopped(self.node, nubLeft, nubTop, distance);
        }

        // remove any positioning that the draggable might have caused
        $wrapper.css({
          left : "",
          top : ""
        });
      }
    });

    /**
     * Attaches the tool to a node.
     *
     * @param {mindmaps.Node} node
     */
    this.attachToNode = function(node) {
      if (this.node === node) {
        return;
      }
      this.node = node;

      // position the nub correctly
      $wrapper.removeClass("left right");
      if (node.offset.x > 0) {
        $wrapper.addClass("right");
      } else if (node.offset.x < 0) {
        $wrapper.addClass("left");
      }

      // set border on our fake node for correct line drawing
      this.depth = node.getDepth();
      var w = view.getLineWidth(this.depth + 1);
      $fakeNode.css("border-bottom-width", w);

      var $node = $getNode(node);
      $wrapper.appendTo($node);
    };

    /**
     * Removes the tool from the current node.
     */
    this.detach = function() {
      $wrapper.detach();
      this.node = null;
    };

    /**
     * Returns whether the tool is currently in use being dragged.
     *
     * @returns {Boolean}
     */
    this.isDragging = function() {
      return dragging;
    };
  }
};

// inherit from base canvas view
mindmaps.DefaultCanvasView.prototype = new mindmaps.CanvasView();
