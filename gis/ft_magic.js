/*
var copiedSectors = [
	{
		label: 'A',
		poly: [{"x":345464,"y":416392,"order":0},{"x":344806,"y":416400,"order":1},{"x":344813,"y":416913,"order":2},{"x":344820,"y":417414,"order":3},{"x":345464,"y":417404,"order":4}]
	},

	{
		label: 'B',
		poly: [{"x":345908,"y":417402,"order":0},{"x":345908,"y":416648,"order":1},{"x":345910,"y":416512,"order":2},{"x":345896,"y":416434,"order":3},{"x":345852,"y":416394,"order":4},{"x":345464,"y":416392,"order":5},{"x":345464,"y":417404,"order":6}]
	},

	{
		label: 'C',
		poly: [{"x":346522,"y":417396,"order":0},{"x":345908,"y":417402,"order":1},{"x":345908,"y":416648,"order":2},{"x":346514,"y":416642,"order":3},{"x":346494,"y":416890,"order":4},{"x":346500,"y":417042,"order":5},{"x":346530,"y":417280,"order":6}]
	},

	{
		label: 'D',
		poly: [{"x":346031,"y":418005,"order":0},{"x":345917,"y":417836,"order":1},{"x":345908,"y":417402,"order":2},{"x":346522,"y":417396,"order":3},{"x":346428,"y":417616,"order":4},{"x":346224,"y":417884,"order":5}]
	},

	{
		label: 'F',
		poly: [{"x":345856,"y":416392,"order":0},{"x":345464,"y":416392,"order":1},{"x":345462,"y":416156,"order":2},{"x":345573,"y":416029,"order":3},{"x":345367,"y":415829,"order":4},{"x":345728,"y":415472,"order":5},{"x":346136,"y":415036,"order":6},{"x":346472,"y":415394,"order":7},{"x":346548,"y":415622,"order":8},{"x":346666,"y":416386,"order":9},{"x":346606,"y":416636,"order":10},{"x":346514,"y":416642,"order":11},{"x":345908,"y":416648,"order":12},{"x":345910,"y":416512,"order":13},{"x":345896,"y":416434,"order":14}]
	},

	{
		label: '대전시청점',
		poly: [{"x":345728,"y":415472,"order":0},{"x":346136,"y":415036,"order":1},{"x":346472,"y":415394,"order":2},{"x":346548,"y":415622,"order":3},{"x":346666,"y":416386,"order":4},{"x":346606,"y":416636,"order":5},{"x":346514,"y":416642,"order":6},{"x":346494,"y":416890,"order":7},{"x":346500,"y":417064,"order":8},{"x":346532,"y":417280,"order":9},{"x":346522,"y":417396,"order":10},{"x":346428,"y":417616,"order":11},{"x":346224,"y":417884,"order":12},{"x":346031,"y":418005,"order":13},{"x":345917,"y":417836,"order":14},{"x":345912,"y":417608,"order":15},{"x":345904,"y":417404,"order":16},{"x":345464,"y":417404,"order":17},{"x":344812,"y":417416,"order":18},{"x":344806,"y":416400,"order":19},{"x":345464,"y":416392,"order":20},{"x":345462,"y":416156,"order":21},{"x":345573,"y":416029,"order":22},{"x":345367,"y":415829,"order":23}]
	}
];

*/

var copiedSectors = false;

/**
*  매장 모든 섹터 목록 보기
*  @Param Shop-Sequence
**/
function showSectorList(shopSeq){
	clearMap();

	pageContext.currentShopSeq = shopSeq;

	if(copiedSectors) {
		newAutoSector(shopSeq, 0);
	} else {
	
		LoadingBar.show();
		
		var targetShop = pageContext.findShop(shopSeq);
		
		//매장 정보 서버 요청 후 Display
		shopService.selectShopDetail({
			params : {shopSeq:shopSeq},
			onSuccess : function(resultSet){
				setMapTitle( resultSet.brandName ,resultSet.shopName);

				pageContext.setAttribute( "selectedShop", resultSet );
				
				var shopGeoPoint = GisMap.Converter.arrayToLatLon( targetShop.location );
				map.setCenter(shopGeoPoint );
				
				//매장위치 마킹
				var marker = map.drawMarker({
					pkid: 'shopMarker'
					,point: shopGeoPoint
					,icon: GisMap.CONST_MARKER_IMG.SHOP
				});
										
			}
		});		

		//섹터 정보 서버 요청 후 Display
		sectorService.selectSectorList({
			params : {shopSeq:shopSeq},
			onSuccess : function(resultSet){
				LoadingBar.hide();
				
				//테이블 Display
				displaySectorsInTable(resultSet);
				//Map Display
				displaySectorsInMap(resultSet);
			}
		});	
	}	
}

/** 
 * 섹터 추가 (자동)
 **/
function newAutoSector(shopSeq, sectorIndex){
	if(sectorIndex >= copiedSectors.length) {
		console.log('오토 마킹이 완료되었습니다.');
		copiedSectors = false;
		showSectorList(shopSeq);
		return;
	}
	
	console.log('오토 마킹을 시작합니다. ' + sectorIndex + ' / ' + copiedSectors.length);

	clearMap();
	
	pageContext.setAttribute( "editMode" , "insert" );
	
	var shop = pageContext.findShop(shopSeq);
	pageContext.setAttribute( "selectedShop", shop );		
	
	setMapTitle(pageContext.selectedBrand.brandName, shop.shopName );
	
	//매장위치 마킹		
	markShopWithPointArray( shop.location );
	map.setCenter( GisMap.Converter.arrayToLatLon( shop.location ));
	
	var targetSector = copiedSectors[sectorIndex];
	
	$('#sectorEditForm').show();		
	// $('#editSectorName').val( "" );		
	$('#editSectorName').val(targetSector.label);

	var polygonEditor = map.drawEditPolygon({
		points : [] ,
		onChanged : function(polygonEditor){ }
	});
	
	//주위 본 매장 섹터 맵에 표시		
	sectorService.selectSectorList({
		params : {shopSeq:shopSeq},
		onSuccess : function(resultSet){				
			displaySectorsInMap(resultSet);
							
			var excludeSeqs = extractField( resultSet , "seq");

			// 주위 타 매장 섹터 맵에 표시
			sectorService.nearSectors({
				brandSeq : pageContext.selectedBrand.seq,
				params : GisMap.Converter.arrayToLatLon( shop.location) ,
				onSuccess : function(nearSectorList){				
					displaySectorsInMap(nearSectorList, {bg_color:POLYGON_COLOR.SectorOther  , exclude:excludeSeqs });		
				}
			});
			
		}
	});

	// 자동 마킹
	markAndSaveAndNextAuto(shopSeq, targetSector, sectorIndex);
	// save and next
}

function markAndSaveAndNextAuto(shopSeq, targetSector, sectorIndex) {
	var polys = targetSector.poly;

	markAuto(polys);
	saveAuto(shopSeq, targetSector, sectorIndex);
}

function markAuto(polys) {
	console.log('마킹!');
	
	polys.push(polys[0]);
	for(var i=0; i < polys.length ; i++) {
	var tmp = new naver.maps.Point(polys[i].x, polys[i].y);
	console.log(tmp);
	var latLng = naver.maps.TransCoord.fromTM128ToLatLng(tmp);
	var position = GisMap.Converter.convertNaverToGisPoint(latLng);
	var pkid = "ep__markingMarker"; 
	var pointList = map.editPolygon.getPoints();
	pointList.push(position);
	map.editPolygon.setPoints(pointList);
	console.log(position);
	
	}
}

function saveAuto(shopSeq, targetSector, sectorIndex) {
	var brandSeq = pageContext.selectedBrand.seq;
	var shop = pageContext.getAttribute( "selectedShop" );
	
	var polygonPoints = map.editPolygon.getPoints();
	if( polygonPoints.length < 3 ){
		alert("위치정보를 입력하여 주세요.");
		return;
	}
	
	var area = map.getArea( polygonPoints );		
	var points = GisMap.Converter.latLonsToArrays( polygonPoints );
	var sectorData = {
			sectorName : $('#editSectorName').val(),				
			shopSeq : shop.seq,
			brandSeq : brandSeq,
			totalArea: area,
			points : points
	};
		
	
	if( String.isEmpty( sectorData.sectorName) ){
		alert("섹터명을 입력하여 주세요.");
		return false;
	}
	
	LoadingBar.show();

	// sectorService.insertSector({
	// 	params : sectorData ,
	// 	onSuccess : function(resultSet){
	// 		LoadingBar.hide();
			
	// 		// 다음 섹터 시작
	// 		newAutoSector(shopSeq, sectorIndex + 1);
	// 	}
	// });

	// 테스트
	setTimeout(function() {
		LoadingBar.hide();
		// 다음
		newAutoSector(shopSeq, sectorIndex + 1); 
	}, 5000);
}
