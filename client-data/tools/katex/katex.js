/**
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
	var board = Tools.board, svg = Tools.svg;

	var input = document.createElement("input");
	input.id = "katexToolInput";
	input.type = "text";
	input.setAttribute("autocomplete", "off");

	var curText = {
		"x": 0,
		"y": 0,
		"size": 36,
		"rawSize":16,
		"oldSize":0,
		"opacity": 1,
		"color": "#000",
		"id": 0,
		"sentText": "",
		"lastSending": 0
	};


	function onStart(evt){
		curText.oldSize=Tools.getSize();
		Tools.setSize(curText.rawSize);
	};

	function onQuit(){
		Tools.setSize(curText.oldSize);
	};

	function clickHandler(x, y, evt, isTouchEvent) {
console.log(evt);
		if($("#menu").width()>Tools.menu_width+3)return;
		if (evt.target == input) return;

		// search for a parent that is a MathElement. If one is found then act on that instead.
		var target = evt.target;
		var a = target;
		var els = [];
		while (a) {
			els.unshift(a);
			a = a.parentElement;
		}
		  console.log(els);
		var parentMathematics = els.find(el => el.getAttribute("class") === "katex");
		if ((parentMathematics) && parentMathematics.tagName === "SPAN") {
			target = parentMathematics.parentElement;
		}

		if (target.tagName === "foreignObject") {
			editOldText(target);
			evt.preventDefault();
			return;
		}
		curText.rawSize = Tools.getSize();
		curText.size = parseInt(curText.rawSize * 1.5 + 12);
		curText.opacity = Tools.getOpacity();
		curText.color = Tools.getColor();
		curText.x = x;
		curText.y = y - curText.size / 1.5;
		stopEdit();
		startEdit();
		evt.preventDefault();
	}

	function editOldText(elem) {
		curText.id = elem.id;
		var r = elem.getBoundingClientRect();
		var x = (r.x+document.documentElement.scrollLeft)/Tools.scale;
		var y = (r.y+r.height+document.documentElement.scrollTop)/Tools.scale;
				
		curText.x = x;
		curText.y = y;
		curText.size = parseInt(elem.getAttribute("font-size"));
		curText.opacity = parseFloat(elem.getAttribute("opacity"));
		curText.color = elem.getAttribute("fill");
		startEdit();
		input.value = elem.txt;
	}
	
	
	function stopEdit() {
		input.blur();
		curText.id=0;
		curText.sentText=""
		input.removeEventListener("keyup", textChangeHandler);
	}

	function startEdit() {
		if (!input.parentNode) board.appendChild(input);
		input.value="";
		var left = curText.x-scrollX +'px';
		var clientW = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
		var x = curText.x*Tools.scale-scrollX;
		if(x+250>clientW){
			x = Math.max(60,clientW-260)
		}
		
		input.style.left=x +'px';
		input.style.top=curText.y*Tools.scale-scrollY + 60 +'px';
		input.focus();
		input.addEventListener("keyup", textChangeHandler);
		input.addEventListener("blur", textChangeHandler);
		input.addEventListener("blur", blur);
	}


	function blur(){
		input.style.top='-1000px';
	};

	function textChangeHandler(evt) {
/*
		if (evt.which === 13) {
			curText.y += 1.5 * curText.size;
			stopEdit();
			startEdit();
		}
*/
		if (evt.which === 13)
			stopEdit();
		if (performance.now() - curText.lastSending > 100) {
			if (curText.sentText !== input.value) {
				//If the user clicked where there was no text, then create a new text field
				if(curText.id==0){
					curText.id = Tools.generateUID("m"); //"m" for math
					Tools.drawAndSend({
						'type': 'new',
						'id': curText.id,
						'color': curText.color,
						'size': curText.size,
						'opacity': curText.opacity,
						'x': curText.x,
						'y': curText.y
					})
				}
				Tools.drawAndSend({
					'type': "update",
					'id': curText.id,
					'txt': input.value.slice(0, 280)
				});
				curText.sentText = input.value;
				curText.lastSending = performance.now();
			}
		} else {
			clearTimeout(curText.timeout);
			curText.timeout = setTimeout(textChangeHandler, 500, evt);
		}
	}

	function draw(data, isLocal) {
		Tools.drawingEvent=true;
		switch (data.type) {
			case "new":
				createTextField(data);
				break;
			case "update":
				var textField = document.getElementById(data.id);
				if (textField === null) {
					console.error("Text: Hmmm... I received text that belongs to an unknown text field");
					return false;
				}else{
					if(Tools.useLayers){
						if(textField.getAttribute("class")!="layer"+Tools.layer){
							textField.setAttribute("class","layer-"+Tools.layer);
							Tools.group.appendChild(textField);
						}
					}
				};
				updateText(textField, data.txt);
				break;
			default:
				console.error("Text: Draw instruction with unknown type. ", data);
				break;
		}
	}

	function updateText(textField, text) {
                if (text) {
		    textField.innerHTML = "";
		    katex.render(text, textField);
		    textField.txt = text;
//		    textField.setAttribute("width", Math.min(1, textField.childNodes[0].offsetWidth));
//		    textField.setAttribute("height", Math.min(1, textField.childNodes[0].offsetHeight));
		}
	}

	function createTextField(fieldData) {
		var elem = Tools.createSVGElement("foreignObject");
		elem.id = fieldData.id;
		elem.setAttribute("x", fieldData.x);
		elem.setAttribute("y", fieldData.y);
		elem.setAttribute("width", 1);
		elem.setAttribute("height", 1);
		if(Tools.useLayers) elem.setAttribute("class","layer-"+Tools.layer);
		elem.setAttribute("font-size", fieldData.size);
		elem.style["font-size"] = fieldData.size;
		elem.setAttribute("fill", fieldData.color);
		elem.style.color = fieldData.color;
		elem.setAttribute("opacity", Math.max(0.1, Math.min(1, fieldData.opacity)) || 1);

		updateText(elem, fieldData.txt);
//                if (fieldData.txt) katex.render(fieldData.txt, elem);
//	        elem.txt = fieldData.txt;

		if(fieldData.data){
			elem.setAttribute("data-lock",fieldData.data);
		}
		if(fieldData.transform)
			elem.setAttribute("transform",fieldData.transform);
		Tools.group.appendChild(elem);
		return elem;
	}

	Tools.add({ //The new tool
		"icon": "Σ",
		"name": "KaTeX",
		"listeners": {
			"press": clickHandler
		},
		"shortcut": "m",
		"onstart":onStart,
		"onquit":onQuit,
		"draw": draw,
		"mouseCursor": "text",
		"stylesheet": "tools/katex/katex.css"
	});

})(); //End of code isolation