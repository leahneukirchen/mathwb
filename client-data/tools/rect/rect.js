﻿/**
 *                        WHITEBOPHIR
 *********************************************************
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2013  Ophir LOJKINE
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License (GNU GPL) as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option)
 * any later version.  The code is distributed WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 * As additional permission under GNU GPL version 3 section 7, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 4, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend
 */

(function () { //Code isolation
	//Indicates the id of the shape the user is currently drawing or an empty string while the user is not drawing
	var curshape="Rectangle",
	shapeIcons = ["▢","◯"],
	end=false,
	curId = "",
	lastX = 0,
	lastY = 0,
	lastTime = performance.now(); //The time at which the last point was drawn

	function start(x, y, evt) {

		//Prevent the press from being interpreted by the browser
		evt.preventDefault();
		Tools.suppressPointerMsg = true;
		curId = Tools.generateUID("r"); //"r" for rectangle
		Tools.drawAndSend({
			'type': 'rect',
			'id': curId,
			'shape':curshape,
			'color': Tools.getColor(),
			'size': Tools.getSize(),
			'opacity': Tools.getOpacity(),
			'x': x,
			'y': y,
			'x2': x,
			'y2': y
		});

		lastX = x;
		lastY = y;
	}

	function move(x, y, evt) {
		/*Wait 20ms before adding any point to the currently drawing shape.
		This allows the animation to be smother*/
		if (curId !== "") {
			var curUpdate = { //The data of the message that will be sent for every new point
				'type': 'update',
				'id': curId,
				'shape':curshape,
				'x': lastX,
				'y': lastY
			}
			curUpdate['x2'] = x; curUpdate['y2'] = y;
			if (performance.now() - lastTime > 70 || end) {
				Tools.drawAndSend(curUpdate);
				lastTime = performance.now();
			}
		}
		if (evt) evt.preventDefault();
	}

	function stop(x, y) {
		//Add a last point to the shape
		end=true;
		move(x, y);
		end=false;
		Tools.suppressPointerMsg = false;
		curId = "";
	}

	function draw(data) {
		Tools.drawingEvent=true;
		switch (data.type) {
			case "rect":
				createShape(data);
				break;
			case "update":
				var shape = svg.getElementById(data['id']);
				if (!shape) {
					console.error("Shape: Hmmm... I received a point of a shape that has not been created (%s).", data['id']);
					return false;
				}else{
					if(Tools.useLayers){
						if(shape.getAttribute("class")!="layer"+Tools.layer){
							shape.setAttribute("class","layer-"+Tools.layer);
							Tools.group.appendChild(shape);
						}
					}
				};
				
				if(data.shape=="Circle"){
					updateCircle(shape, data);
				}else{
					updateRect(shape, data);
				}
				break;
			default:
				console.error("Straight shape: Draw instruction with unknown type. ", data);
				break;
		}
	}

	var svg = Tools.svg;
	function createShape(data) {
		//Creates a new shape on the canvas, or update a shape that already exists with new information
		var shape = svg.getElementById(data.id); 
		if(data.shape=="Circle"){
			if(!shape) shape = Tools.createSVGElement("circle");
			updateCircle(shape, data);
		}else{
			if(!shape) shape = Tools.createSVGElement("rect");
			updateRect(shape, data);
		}
		shape.id = data.id;
		//If some data is not provided, choose default value. The shape may be updated later
		if(Tools.useLayers)
		shape.setAttribute("class","layer-"+Tools.layer);
		shape.setAttribute("stroke", data.color || "black");
		shape.setAttribute("stroke-width", data.size || 10);
		shape.setAttribute("opacity", Math.max(0.1, Math.min(1, data.opacity)) || 1);
		Tools.group.appendChild(shape);
		return shape;
	}

	function updateRect(shape, data) {
		shape.x.baseVal.value = Math.min(data['x2'], data['x']);
		shape.y.baseVal.value = Math.min(data['y2'], data['y']);
		shape.width.baseVal.value = Math.abs(data['x2'] - data['x']);
		shape.height.baseVal.value = Math.abs(data['y2'] - data['y']);
		shape.setAttribute("fill", "none");
		if(data.transform)
			shape.setAttribute("transform",data.transform);
	}

	function updateCircle(shape, data) {		
		shape.cx.baseVal.value = Math.round((data['x2'] + data['x'])/2);
		shape.cy.baseVal.value = Math.round((data['y2'] + data['y'])/2);
		shape.r.baseVal.value = Math.round(Math.sqrt(Math.pow(data['x2'] - data['x'],2)+Math.pow(data['y2'] - data['y'],2))/2);
		shape.setAttribute("fill", "none");
		if(data.transform)
			shape.setAttribute("transform",data.transform);
	}

	function toggle(elem){
		var index = 0;
		if(curshape=="Rectangle"){
			curshape="Circle";
			index=1;
		}else{
			curshape="Rectangle";
		}
		elem.getElementsByClassName("tool-icon")[0].textContent = shapeIcons[index];
	};

	Tools.add({ //The new tool
		// "name": "Rectangle",
		 "icon": "▢",
        "name": "Rectangle",
        //"icon": "",
		"listeners": {
			"press": start,
			"move": move,
			"release": stop,
		},
		"draw": draw,
		"toggle":toggle,
		"mouseCursor": "crosshair",
		"stylesheet": "tools/rect/rect.css"
	});

})(); //End of code isolation
