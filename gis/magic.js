/*
var wait = document.createElement('div');
wait.style = 'width:100%;height:100%;position:absolute;top:0;left:0;z-index:10000;background-color:black';
document.body.appendChild(wait);

var waitingMessage = document.createElement('h1');
waitingMessage.innerText = '잠시만 기다려주세요!';
waitingMessage.style = 'font-size:20pt;color:white;';
wait.appendChild(waitingMessage);

var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://rawgit.com/nnoco/tools/master/gis/magic.js';
document.body.appendChild(script);
*/



// mapFrame
var area = {
	strokeColor : "#FF0000",
	strokeWeight : "2pt",
	strokeOpacity : "0.9",
	//strokeDashStyle : "9 5",
	fillColor : "#1E90FF",
	fillOpacity : "0.1",
	strokeEndcap :"round" ,
	pointWeight :2,
	pointStrokeColor :  "rgba(255, 0, 0, 0.5)",
	pointFillColor : "rgba(255, 255, 0, 0.3)",
	pointRadius : 30		
};

var area_over = {
	strokeColor : "#1E90FF",
	strokeWeight : "1.5pt",
	strokeOpacity : "0",
	//strokeDashStyle : "9 5",
	fillColor : "rgba(255, 255, 255, 0)",
	fillOpacity : "0.0",
	strokeEndcap :"round" ,
	pointWeight :4,
	pointStrokeColor :  "rgba(0, 0, 255, 0.7)",
	pointFillColor : "rgba(255, 255, 0, 1)",
	pointRadius : 3		
};

var area_edit = {
	strokeColor : "#FF0000",
	strokeWeight : "1.5pt",
	strokeOpacity : "0.9",
	//strokeDashStyle : "9 5",
	fillColor : "#FF0000",
	fillOpacity : "0.2",
	strokeEndcap :"round" ,
	pointWeight :1,
	pointStrokeColor :  "#FF0000",
	pointFillColor : "#FFFFFF",
	pointRadius : 10		
};

var currentPolyItems;

var isCopyButtonClicked = false;

var backgroundColors = [
	'999999','666666','333333','3300ff','3333ff','3366ff',
	'3399ff','33ccff','33ffff','66ffff','66ccff','6699ff',
	'6666ff','6633ff','6600ff','ff00ff','ff33ff','ff66ff',
	'ff99ff','ffccff','ff99ff','ff66ff','ff33ff','ff00ff',
	'6600ff','6633ff','6666ff','6699ff','66ccff','66ffff',
	'33ffff','33ccff','3399ff','3366ff','3333ff','3300ff',
	'333333','666666'
];

function adjustInputRow() {
/*
<tr id="adjustRow">
	<td>보정 <input name="isAdjust" type="checkbox"></td>
	<td>
		<label for="adjustForMarket"><input type="radio" name="adjust" id="adjustForMarket" value="market"> 마켓</label> &nbsp;
		<label for="adjustForSection"><input type="radio" name="adjust" id="adjustForSection" value="section"> 섹션</label>
		<input type="hidden" id="currentCopiedPolys">
	</td>
</tr>
*/
}

function copyButton() {
/*
<br><button onclick="javascript:copyToClipboard(this)" data-clicked="0" data-idx="${idx}" style="width:80px;padding:8px;background-color:#cccccc;border:none;cursor:pointer;">복사</button><br><br>
*/
}

function copyToClipboard(button) {
	var idx = $(button).attr('data-idx');
	var clicked = parseInt($(button).attr('data-clicked'));
	$(button).attr('data-clicked', clicked + 1);
	$('#currentCopiedPolys').val(currentPolyItems[idx].polys);
	isCopyButtonClicked = true;
	$(button).text('복사됨').css('background-color', backgroundColors[clicked % backgroundColors.length]);

	document.execCommand('copy');
}

function getFunctionContents(f) {
	var lines = f.toString().split('\n');
	return lines.slice(2, lines.length - 2).join('\n');
}

function renderCopyButton(idx) {
	var item = currentPolyItems[idx];
	
	var button = getFunctionContents(copyButton);
	button = button.replace(/\$\{label\}/gi, item.label);
	button = button.replace(/\$\{idx\}/gi, item.idx);

	return button;
}
	
function getMarketPolyItem(section, label) {
	var item = {
		section: section,
		idx: section.idx,
		label: label,
		polys: 'var polys = ' + JSON.stringify(section.poly)
	};

	currentPolyItems[section.idx] = item;
	return item;
}

function append($parent, f) {
	$parent.append(getFunctionContents(f));
}

var polyTextArea;
(function(){
	var jquery = document.createElement('script')
	jquery.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
	document.body.appendChild(jquery);
	jquery.onload = function() {
		if(wait) {
			$(wait).fadeOut();
		}
		
		initAdjustMode();
		initCopyEvent();
	}
})();

function initAdjustMode() {
	var adjusts = getFunctionContents(adjustInputRow);
	$('#addrName').parent().parent().parent().children().last().before($(adjusts));
}

function initCopyEvent() {
	document.addEventListener('copy', function(e) {
		if(isCopyButtonClicked) {
			e.preventDefault();
			e.clipboardData.setData('text/plain', $('#currentCopiedPolys').val());
			console.log('복사되었습니다.');
			console.log($('#currentCopiedPolys').val());
			isCopyButtonClicked = false;
		}
	});
}

//검색 쿼리
function searchQuery(pars){
	//검색시 선택한상권(tp.choiceShop)은 초기화, 되돌리기 정보가 남아있을 경우 경고창띄우고 return
	//상권리스트선택도 마찬가지로....
	//shopsearch_proc.jsp

	infoEditReset();

	processOn();

	$.post("getMarket.do", pars, function(data) {
		eval('data = ' + data);

		tp.mapf = mapFrame.FreeMapObj;

		tp.shopSetting(data);
		setPolyList(data);
		setShopList(tp.shopObj);
		
		processOff();
	});
}

// textarea 채우기
function setPolyList(data) {
	// getMarketPolyItem에서 추가함.
	currentPolyItems = {};

	var isStoreAndSection = false;
	for(var i = 0 ; i < data.store.length ; i++) {
		var store = data.store[i];
		if(store.name.startsWith('@')) {
			data.market = store;
			data.marketIndex = i;
			isStoreAndSection = true;
		}
	}

 	var market;
 	var sections = [];
	if(isStoreAndSection) {
		data.market.realName = data.market.name.replace(/@/gi, "");

		market = data.market;
		for(var i = 0 ; i < data.store.length ; i++) {
			if(i == data.marketIndex) continue;
			var store = data.store[i];
			store.sectionName = store.name.replace(market.realName, "");
			sections.push(store);
		}

	}

	// #polyList에 추가
	// polyListLi
	items = [];

	var text = '';
	if(isStoreAndSection) {
		items.push(getMarketPolyItem(market, market.realName));

		for(var i = 0 ; i < sections.length ; i++) {
			var section = sections[i];

			items.push(getMarketPolyItem(section, section.sectionName));
		}
	} else {
		for(var i = 0 ; i < data.store ; i ++) {
			var store = data.store[i];

			items.push(getMarketPolyItem(store, store.sectionName));
		}
	}
}

function setShopList(jo){
		//alert(jo.store.length );
		document.getElementById("shopList").innerHTML="";
		document.getElementById("zoneList").innerHTML="";
		
		var listEM=document.createElement("ul");
		
		var listRowEM=document.createElement("li");
		if(rectSearchChk)
		{
  		for(var i=0; i<jo.store.length; i++){
  			s=jo.store[i];
  			cloneRowEM=listRowEM.cloneNode("true");
  
  			cloneRowEM.innerHTML="<div><a href='javascript:shopMapAll_Sub(\""+s.x+"\",\""+s.y+"\",\""+s.idx+"\", "+i+");'>"
  			+s.name+" ("+(s.idx)+")"
  			+"</a>" + renderCopyButton(s.idx) + "</div>";
  
  				//+"<div><input type='checkbox' name='zone' onclick='zoneSelect()' /></div>";
  
  			listEM.appendChild(cloneRowEM);
  		}
		}
		else
		{
		  for(var i=0; i<jo.store.length; i++){
  			s=jo.store[i];
  			cloneRowEM=listRowEM.cloneNode("true");
  
  			cloneRowEM.innerHTML="<div><a href='javascript:shopMoveMap(\""+s.x+"\",\""+s.y+"\",\""+s.idx+"\", "+i+");'>"
  			+s.name+" ("+(s.idx)+")"
  			+"</a>" + renderCopyButton(s.idx) + "</div>";
  
  				//+"<div><input type='checkbox' name='zone' onclick='zoneSelect()' /></div>";
  
  			listEM.appendChild(cloneRowEM);
  		}
		}
		document.getElementById("shopList").appendChild(listEM);
		
		if(rectSearchChk)
		{
		  tp.rectSearchChk = true;
		  shopMapAll();
		}
	}

function shopMoveMap(x, y, idx, em) {
		var isConfirm=true;
//alert(tz.undoInfo.length);
		if(tz.undoInfo.length>0){  //YCK : 앞에서 작업하던 매장의 소수역 변경 사항 인듯 - 선 작업에 대한 저장 확인 부분인듯
			isConfirm=confirm("소구역 변경된 사항이 있습니다. 선택하시겠습니까?");
		}
		
		if(mapFrame.shopzone.length > 0)
		{
			//alert(mapFrame.shopzone[0][0]);
			if(mapFrame.shopzone[0][1] == true)
			{
				isConfirm=confirm("이전 매장 영역의 변경된 사항이 있습니다. 저장 없이 선택하시겠습니까?");
			}
		}

		if(isConfirm){
			tz.undoInfo=[];
			tz.zonePolyObj={};//매장리스트 선택시 선택했던 소구역삭제
			//shopMoveMap("345184","416744","10028A", 0);
			//--mapf.RemoveUserSymbol(401);	//전에 선택한 매장영역심볼 지우기
			//mapFrame.FreeMapObj.removeKeyLayers(mapFrame.IconList[1][0]);
			//mapFrame.removeMarker(mapFrame.IconList[1][0]);
			mapFrame.allReset();
			mapFrame.mapReset();
			//20141121_추가(특정 값의 전체 마커를 삭제 - IconList에 따라 해당 변수량 조정)
			mapFrame.markerReset(false, true, true, false, false, false, false, false);
								
			var str = "";
			var tooltip = "";
			for(var i=0; i<tp.shopObj.store.length; i++){
				var s=tp.shopObj.store[i];
				if(s.idx==idx){
					
					//s 20150421 명칭ID검색 시 폴리 데이터를 가져오지 않기 때문에 해당 명칭ID의 폴리정보 불러오기 기능 추가 
					var pars={
			  				type:1,
			  				type0:encodeURI(idx)
			  				};
			  
			  		infoEditReset();
					processOn();

					$.post('getMarket.do', pars, function(data) {
						eval('var jo = ' + data);
						processOff();
						tp.shopObj.store[i] = jo.store[0];
						s = tp.shopObj.store[i];
					});
					
					tp.choiceShop=s;
					tp.choiceShop.order=i;
					str = s.name;
					tooltip = idx;
				  break;
				}
			}
			
      mapFrame.nowZone = idx;
  		mapFrame.nowsmallZone = null;


//alert(tp.choiceShop.poly.length);
			if(tp.choiceShop.poly.length>1){	
				var rectCoord=tg.PolyRect(tp.choiceShop.poly);
				//--mapf.RequestMapRect(rectCoord.minX, rectCoord.minY, rectCoord.maxX, rectCoord.maxY, 30);
				//alert(rectCoord.minX);
				//mapFrame.FreeMapObj.setBound_PM(rectCoord.minX, rectCoord.maxY, rectCoord.maxX, rectCoord.minY, +1);
				mapFrame.FreeMapObj.setBound_PM(rectCoord.minX, rectCoord.maxY, rectCoord.maxX, rectCoord.minY, 0);
			}else{
				//--mapf.RequestMap(x, y, mapf.DrawScale, -1, "", "");
				mapFrame.FreeMapObj.setCenterAndZoomLevel(x,y,12);
			}
			
			// 20150421 추가(매장영역 중심 표시)
  			mapFrame.drawZoneIcon(x, y, str + "<br>(" + tooltip + ")");
			
			//tz
			tz.choiceShop=tp.choiceShop;
			if(tz.choiceShop.poly.length>1){
				//매장 영역이 있는 경우
				/*
				var point = new Array();
				for(var i=0; i<tp.choiceShop.poly.length; i++){ //매장 영역의 포인트 수량 만큼
					var s=tp.choiceShop.poly[i];
					//--mapf.AddUserSymbolAlignEx(401, 1003, 1, s.x, s.y, 0, 0, 400, "", "", "", "_blank", 3); //--> 포인트에 원형 아이콘 찍는 듯..
					point.push(new FreeMapPoint(s.x, s.y));
				}
				*/
				//alert(tp.shopNID);
				if(mapFrame.drawZone.apply(mapFrame, [tp.choiceShop.poly]))
				{
  				//edit visual
  				polyEdit.vBranch(true);
  				  
    		  var shopzone_sub = new Array();
    			shopzone_sub.push(idx);
    			shopzone_sub.push(false);
    			shopzone_sub.push(mapFrame.mrpizza_branch_border);
			
        	mapFrame.shopzone.push(shopzone_sub);
        	
        	var shopzone_sub2 = new Array();
    			shopzone_sub2.push(idx);
    			shopzone_sub2.push(false);
        	var polygon = mapFrame.mrpizza_branch_border;
        	var pt = polygon.getPoint();
        	var point2 = new Array();
          for(var i=0; i<pt.length; i++){
        		point2.push(new mapFrame.FreeMapPoint(pt[i].x,pt[i].y));
        	}
        	shopzone_sub2.push(new mapFrame.FreeMapPolygon(point2)); //원본 저장
        	
        	mapFrame.shopzone_ol.push(shopzone_sub2);
        	//alert(mapFrame.shopzone[0][2].getPoint().length)
  			  //alert(mapFrame.shopzone[0][0]);
  			  //alert(mapFrame.shopzone[0][2]);
      	}
			}else{
				//edit visual
				polyEdit.vBranch(false);
	
	      var shopzone_sub = new Array();
  			shopzone_sub.push(idx);
  			shopzone_sub.push(false);
  			shopzone_sub.push(new mapFrame.FreeMapPolygon(new Array()));
      	mapFrame.shopzone.push(shopzone_sub);
      	
    	  var shopzone_sub2 = new Array();
  			shopzone_sub2.push(idx);
  			shopzone_sub2.push(false);
      	shopzone_sub2.push(new mapFrame.FreeMapPolygon(new Array())); //원본 저장
      	mapFrame.shopzone_ol.push(shopzone_sub2);
      	
				alert("매장의 영역이 없습니다!!");
			}
			
			zoneReSelect(tp.choiceShop.idx);  //기존 소구역 아이콘 및 영역 삭제,  소구역 deliveryzone 조회
	
			shopSelect();  //매장 상권리스트선택, X
			
			var bList=document.getElementById("shopList").getElementsByTagName("a");
			for(var i=0; i<bList.length; i++)
			{
				if(i==em){
					bList[i].className="bListSelect";
				}else{
					bList[i].className="bList";
				}
			}
		} //if(isConfirm){
	}


// 화면내 검색일 때
// mapFrame.drawRectZonePoly = function(Obj){	
// 	//drawGraphics.removeDrawObject(obj);
// 	var point = new Array();
// 	var ply = Obj.getPoint();
// 	for(var i=0; i<ply.length; i++){ //매장 영역의 포인트 수량 만큼
// 		point.push(new FreeMapPoint(ply[i].x, ply[i].y));
// 	}
	
// 	var polygon = new FreeMapPolygon(point);
// 	polygon.setDrawPoint(true);
// 	polygon.setDrawStyle(areaRect);
// 	console.log('areaRect', areaRect);
// 	//반드시 콜백함수 레퍼런스로 넣어야 한다. 
		
// 	//FreeMapEvent.addListener(polygon, "dblclick", function(){click_polygon(polygon);});
	
// 	polygon.setModifyDrawStyle(area_edit);
  
//   mrpizza_branch_border = polygon;
  
// 	drawGraphics.draw(mrpizza_branch_border);
	
// 	return true;
// }

mapFrame.drawZone = function(){	
	var Obj = arguments[0];
	//drawGraphics.removeDrawObject(obj);
	var point = new Array();
	for(var i=0; i<Obj.length; i++){ //매장 영역의 포인트 수량 만큼
		var s=Obj[i];
		point.push(new this.FreeMapPoint(s.x, s.y));
	}
	var polygon = new this.FreeMapPolygon(point);
	polygon.setDrawPoint(true);	//20141121_수정(화면 내 매장영역 표시 후 포인트로 인한 느려짐 현상 해결 위해 제거)
	polygon.setDrawStyle(area);
		
	//FreeMapEvent.addListener(polygon, "dblclick", function(){click_polygon(polygon);});
	
	polygon.setModifyDrawStyle(area_edit);
  
    this.mrpizza_branch_border = polygon;
  
	this.drawGraphics.draw(this.mrpizza_branch_border);

	// 하나 더 그리기
	var polygonOver = new this.FreeMapPolygon(point);
	polygonOver.setDrawPoint(true);
	polygonOver.setDrawStyle(area_over);
	polygonOver.setModifyDrawStyle(area_edit);
	this.drawGraphics.draw(polygonOver);
	
	return true;
}


if(typeof tiloj=="undefined"){tiloj={};}

tiloj=function(){
	this.test="test test";
};

tiloj.prototype={
	init:function(){
		alert(this.test);
	},
	createXMLHttpRequest:function(){
		var xml = null;
		if(window.ActiveXObject){xml = new ActiveXObject("Microsoft.XMLHTTP");}
		else if(window.XMLHttpRequest){xml = new XMLHttpRequest();}
		return xml;
	},
	ajax:function(url, pars, type, func, sync){
		var xml=this.createXMLHttpRequest();
		func = func || function(){};
		var param=typeof pars=="string"?pars:this.serialize(pars);
		if(sync == undefined) sync = true;
		
		//alert(url);
		//alert(param);
		xml.open("POST",url, sync);
		xml.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		
		//타임아웃검사
		var timeoutLength=8000;
		var requestDone=false;
		
		
		//IE6.0 이상
		//setTimeout(function(){requestDone=true;},timeoutLength);
				
		//언제 문서의 상태가 갱신되는지 감시
		xml.onreadystatechange=function(){
			if(xml.readyState==4 && !requestDone)
			{
				if(httpSuccess(xml)){
					try{
					func(type=="j"?eval("("+(httpData(xml, "POST")).replace(/\s/g ," ")+")"):type=="x"?httpData(xml, "xml"):httpData(xml, "POST"));
					}catch (e) {
						
					}
				}else{
					//ERROR
					//alert("ERROR");
				}
				xml=null;
			}
		};
		//alert(param);
		xml.send(param);
		
		function httpSuccess(r){
			try{
				return !r.status && location.protocol == "file:" ||
				(r.status >= 200 && r.status < 300) ||
				r.status == 304 ||
				navigator.userAgent.indexOf("Safari")>=0 &&
					typeof r.status == "undefined";
			}catch(e){}
			return false;
		}
		
		function httpData(r, type){
			var ct=r.getResponseHeader("content-type");
			var data=!type && ct && ct.indexOf("xml") >= 0;
			data=type=="xml"||data? r.responseXML:r.responseText;
			if(type=="script"){
				eval.call(window, data);
			}
			return data;
		}
	},
	/*
	 * json형태의 data를 직렬화
	 */
	serialize:function(a){
		var s=[];
		if(a.constructor==Array){for(var i=0;i<a.length;i++)s.push(a[i].name+"="+encodeURIComponent(a[i].value));}
		else{for(var j in a)s.push(j+"="+encodeURIComponent(a[j]));}
		return s.join("&");
	}
};
var tj=new tiloj();

//정보수정 컨트롤 초기화(숨김)
	function infoEditReset(){
		document.getElementById("editControl").style.display="none";
		document.getElementById("zoneControl").style.display="none";
		tz.undoInfo=[];
		tz.zonePolyObj={};
		tz.undoInfo=[];
		polyEdit.vDelivery_nonCache();
		
		if(document.mapFrame.shopzone.length == 1)
  	{
  	  document.mapFrame.shopzone.pop();
  	}
  	if(document.mapFrame.deliveryzone.length >= 1)
  	{
  		for(var k=document.mapFrame.deliveryzone.length-1; k>=0; k--)
  		{
  			document.mapFrame.deliveryzone.pop();
  		}
  	}
	}




	//화면 조회 시 처음 리스트 표시
	function shopMapAll()
	{
		tz.undoInfo=[];
		tz.zonePolyObj={};//매장리스트 선택시 선택했던 소구역삭제
		
		mapFrame.nowI = 0;
		
		mapFrame.allReset();
		mapFrame.mapReset();
		//20141121_추가(특정 값의 전체 마커를 삭제 - IconList에 따라 해당 변수량 조정)
		mapFrame.markerReset(false, true, true, false, false, false, false, false);
		
		mapFrame.nowsmallZone = null;
    
		var str = "";
		var tooltip = "";
		var mrpizza_branch_border_nm = -1;
		//alert(tp.shopObj.store.length);
		for(var i=0; i<tp.shopObj.store.length; i++)
		{
			var s=tp.shopObj.store[i];
			if(i == 0){
				tp.choiceShop=s;
				tz.choiceShop=s;
				tp.choiceShop.order=i;
				str = s.name;
				mapFrame.nowZone = s.idx;
			}
      
      polyEdit.vBranch(true);
      
      if(s.poly.length>1)
      {
        if(mrpizza_branch_border_nm == -1)
        {
          mrpizza_branch_border_nm = i;
        }
        if(mapFrame.drawZone(s.poly))
  			{
//  			  alert(s.idx);
        	//20141121_추가(매장영역 중심 표시)
  			mapFrame.drawZoneIcon(s.x, s.y, s.name + "<br>(" + s.idx + ")");
    		  var shopzone_sub = new Array();
    			shopzone_sub.push(s.idx);
    			shopzone_sub.push(false);
    			shopzone_sub.push(mapFrame.mrpizza_branch_border);
  		
        	mapFrame.shopzone.push(shopzone_sub);
        	
        	var shopzone_sub2 = new Array();
    			shopzone_sub2.push(s.idx);
    			shopzone_sub2.push(false);
        	var polygon = mapFrame.mrpizza_branch_border;
        	var pt = polygon.getPoint();
        	var point2 = new Array();
          for(var p=0; p<pt.length; p++){
        		point2.push(new mapFrame.FreeMapPoint(pt[p].x,pt[p].y));
        	}
        	shopzone_sub2.push(new mapFrame.FreeMapPolygon(point2)); //원본 저장
        	
        	mapFrame.shopzone_ol.push(shopzone_sub2);
      	}
  		}else{
        var shopzone_sub = new Array();
  			shopzone_sub.push(s.idx);
  			shopzone_sub.push(false);
  			shopzone_sub.push(new mapFrame.FreeMapPolygon(new Array()));
      	mapFrame.shopzone.push(shopzone_sub);
      	
    	  var shopzone_sub2 = new Array();
  			shopzone_sub2.push(s.idx);
  			shopzone_sub2.push(false);
      	shopzone_sub2.push(new mapFrame.FreeMapPolygon(new Array())); //원본 저장
      	mapFrame.shopzone_ol.push(shopzone_sub2);
  		}
		}
		mapFrame.mrpizza_branch_border = mapFrame.shopzone[mrpizza_branch_border_nm][2];
		//rectSearchChk = false;
	}

	function shopMapAll_Sub(x, y, idx, em)
	{
    //alert(tz.undoInfo.length);
		if(mapFrame.deliveryzone.length > 0)
		{
		  for(var i=0; i < mapFrame.deliveryzone.length; i++)
		  {
		    if(mapFrame.deliveryzone[i][1] == true)  //YCK : 앞에서 작업하던 매장의 소수역 변경 사항 - 선 작업에 대한 저장 확인 부분인듯
		    {
		      if(!confirm("이전 매장의 소구역 변경된 사항이 있습니다." + "\n" + "취소하고 다른 매장을 선택하시겠습니까?"))
		      {
		        return;
		      }
		    }
		  }
		}
		
		tz.undoInfo=[];
		tz.zonePolyObj={};//매장리스트 선택시 선택했던 소구역삭제
		
		mapFrame.rectReset();
		mapFrame.mapReset();
		//20141121_추가(특정 값의 전체 마커를 삭제 - IconList에 따라 해당 변수량 조정)
		mapFrame.markerReset(false, true, false, false, false, false, false, false);
    mapFrame.nowsmallZone = null;
    mapFrame.nowZone = idx;

	//edit visual 20141124_추기(영역이 존재 하지 않는 신규매장의 경우로 인하여 Edit창 초기화)
	polyEdit.vBranch(true);
							
		var str = "";
		var tooltip = "";
		for(var i=0; i<tp.shopObj.store.length; i++){
			var s=tp.shopObj.store[i];
			if(s.idx==idx){
			  //alert(s.idx);
				tp.choiceShop=s;
				tp.choiceShop.order=i;
				str = s.name;
			  break;
			}
		}
		
		//tz
		tz.choiceShop=tp.choiceShop;
		
    //매장영역 다시 그리기
    //선택 매장영역은 다른 색으로
    //소구역 선택하여 그리기
//alert(tp.choiceShop.poly.length);
//alert(mapFrame.shopzone.length);
		for(var i = 0; i < mapFrame.shopzone.length; i++)
		{
      //alert("* i : " + i + " , idx : " + idx + " , shopzone[i] : " + mapFrame.shopzone[i][0]);
		  var ply = mapFrame.shopzone[i][2].getPoint();
	    if(mapFrame.shopzone[i][0]==idx)
	    {
	      mapFrame.nowI = i;
	      var minX, minY, maxX, maxY, midX, midY;
  	    if(ply.length>1)
  	    {
  	      zoneReSelect(tp.choiceShop.idx);  //기존 소구역 아이콘 및 영역 삭제,  소구역 deliveryzone 조회
  	      
  	      for(var p=0; p<ply.length; p++){
        		if(p==0){
        			minX=ply[p].x;
        			minY=ply[p].y;
        			maxX=ply[p].x;
        			maxY=ply[p].y;
        		}else{
        			minX=minX>ply[p].x?ply[p].x:minX;
        			minY=minY>ply[p].y?ply[p].y:minY;
        			maxX=maxX<ply[p].x?ply[p].x:maxX;
        			maxY=maxY<ply[p].y?ply[p].y:maxY;
        		}
          }
    			mapFrame.FreeMapObj.setBound_PM(minX, maxY, maxX, minY, 0);
    			
    			//그리기 drawRectZonePoly - drawRectZonePoly가 빨간색으로 그리는거 
    			if(mapFrame.drawRectZonePoly(mapFrame.shopzone[i][2])) //그리기만 함
    			{
    				//alert("선택영역");
        	}
    		}else{
				//20141121_수정(신규매장의 경우 영역이 존재 하지 않으므로 해당 위치로만 이동)
				if(ply.length == 0){
					
					//edit visual
					polyEdit.vBranch(false);
					
					mapFrame.FreeMapObj.setCenterAndZoomLevel(x,y,mapFrame.drawGraphics.getLevel());
					mapFrame.addMarker_pos(str, tooltip, mapFrame.IconList[1], x, y, false);
					alert("매장의 영역이 없습니다!!");
				}else{
					for(var p=0; p<ply.length; p++){
						if(p==0){
							minX=ply[p].x;
							minY=ply[p].y;
							maxX=ply[p].x;
							maxY=ply[p].y;
						}else{
							minX=minX>ply[p].x?ply[p].x:minX;
							minY=minY>ply[p].y?ply[p].y:minY;
							maxX=maxX<ply[p].x?ply[p].x:maxX;
							maxY=maxY<ply[p].y?ply[p].y:maxY;
						}
					}
					midX = minX + ((maxX-minX)/2);
					  midY = minY + ((maxY-minY)/2);
					  mapFrame.FreeMapObj.setCenterAndZoomLevel(midX,midY,12);
						mapFrame.addMarker_pos(str, tooltip, mapFrame.IconList[1], midX, midY, false);	
				}
    		}
  		}
  		else{ //다른 매장영역
  		  if(ply.length>1)
  		  {
  		    if(mapFrame.drawZonePoly(mapFrame.shopzone[i][2])) //그리기만 함
  		    {
  		      //alert("다른영역");
  		    }
  		  }
  		}
		}
		/**/		
		shopSelect();  //매장 상권리스트선택, X
		
		var bList=document.getElementById("shopList").getElementsByTagName("a");
		for(var i=0; i<bList.length; i++)
		{
			if(i==em){
				bList[i].className="bListSelect";
			}else{
				bList[i].className="bList";
			}
		}
		/**/
	}
