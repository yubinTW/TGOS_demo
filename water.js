var dm; // 繪圖管理器
var measureServ; // 測量服務
var mapOptions = {
	"mapTypeControl":false, // 顯示地圖類型控制選項
};
var clusterOption = {
	"bounds": 15,
	"maxZoom": 12,
};

function init() {
   mDiv = document.getElementById("TGMap");
   map = new TGOS.TGOnlineMap(mDiv, TGOS.TGCoordSys.EPSG3857, mapOptions);

	// 地圖標記，marker , markercluster
  marker_1 = new TGOS.TGMarker(map, new TGOS.TGPoint(120.9969153, 24.783003), "安研科技");
  marker_2 = new TGOS.TGMarker(map, new TGOS.TGPoint(120.9968965, 24.786062), "交通大學");
  marker_3 = new TGOS.TGMarker(map, new TGOS.TGPoint(121.038108, 24.8081952), "新竹高鐵站");
  marker_4 = new TGOS.TGMarker(map, new TGOS.TGPoint(120.9910429, 24.7947302), "清華大學");

  cluster = new TGOS.TGMarkerCluster(map, [marker_1, marker_2, marker_3, marker_4], clusterOption);
  cluster.redrawAll();

  measureServ = new TGOS.TGMeasureService();

  dm = new TGOS.TGDrawing(); 
  dm.setMap(map);
  dm.setDefaultControlVisible(false);
  dm.setOptions({
    drawingControl: false,
    polylineOptions: {
        strokeWeight: 2,
        strokeColor: '#111',
        strokeOpacity: 0.5
    },
    polygonOptions:{
        fillColor: "#eeaaaa",
        fillOpacity: 0.5,
        opacity: 0.8,
        strokeColor: "#333",
        strokeOpacity: 0.9,
        strokeWeight: 1.5,
    }
});
  TGOS.TGEvent.addListener(dm, 'linestring_complete', lineCompleteHandler);
  TGOS.TGEvent.addListener(dm, 'polygon_complete', polygonCompleteHandler);
}; // end of init()

// 繪圖處理器切換到直線模式，開始讓使用者畫折線   
function startDrawingLine(){
    clearAllGraphics();
    dm.enterLineStrMode();
    switchDrawingLine();
    document.getElementById('tips').innerHTML = '點擊地圖上任一點作為測量起點，雙擊結束路徑繪製。';
}

// 畫完直線後被呼叫，丟給測量服務得到折線距離
function lineCompleteHandler(e){
    measureServ.wgs84LineMeasure(e.overlay.getPath(), function(length, status) {
        console.log("status: "+status);
        console.log("length: "+length);
        document.getElementById('tips').innerHTML = '測量長度：<br>'+length+"公尺";
    }); 
    dm.setDrawingMode(TGOS.TGOverlayType.NONE);
    switchDrawingLine();
}

// 切換畫直線按鈕的開關樣式
function switchDrawingLine(){
    document.getElementById('btn-measure-line').classList.toggle('btn-info');
    document.getElementById('btn-measure-line').classList.toggle('btn-warning');
}

// 繪圖管理器切換成多邊形模式，讓使用者可以話面積
function startDrawingArea(){
    clearAllGraphics();
    dm.enterPolygonMode();
    switchDrawingArea();
    document.getElementById('tips').innerHTML = '點擊地圖標註範圍，雙擊結束繪製。';
}

// 多邊形完成後呼叫，使用測量服務得到繪圖面積
function polygonCompleteHandler(e){
    measureServ.wgs84PolygonMeasure(e.overlay.getPath(), function(area, status) {
        console.log("status: "+status);
        console.log("length: "+area);
        document.getElementById('tips').innerHTML = '測量面積：<br>' + area + "平方公尺";
    });
    dm.setDrawingMode(TGOS.TGOverlayType.NONE);
    switchDrawingArea();
}

// 切換開關的測量紐樣式   
function switchDrawingArea(){
    document.getElementById('btn-measure-area').classList.toggle('btn-info');
    document.getElementById('btn-measure-area').classList.toggle('btn-warning');
}

// 清空繪圖管理器畫出來的圖形
function clearAllGraphics(){
    dm.clearAllGraphics();
    document.getElementById('tips').innerHTML = '';
}

// 地址轉換座標服務
// 以中文地址去查詢WGS84的座標，放一個marker到指定位置，地圖顯示該區域
var locateMarker;
function locate() {
    locateMarker = new TGOS.TGMarker(map, new TGOS.TGPoint(0, 0));
    locateMarker.setVisible(false);

    var locator = new TGOS.TGLocateService();  //宣告定位物件
    locator.locateWGS84({  //指定回傳結果為locateWGS84坐標系統
        address : document.getElementById('address').value  //要求地址定位
    }, function(e, status) {
        if (status != TGOS.TGLocatorStatus.OK) {
            return;
        }
        locateMarker.setVisible(true);
        locateMarker.setPosition(e[0].geometry.location);  //將定位結果以標記顯示
        map.fitBounds(e[0].geometry.viewport);  //將地圖畫面移至符合查詢之位置                
        
        let x = e[0].geometry.location.x;
        let y = e[0].geometry.location.y;

        document.getElementById("addrXY_WGS84").innerHTML = "WGS84:<br>(" + x + "," + y + ")";  //在addrXY Div中顯示地址坐標
        var TT = new TGOS.TGTransformation();
        TT.wgs84totwd97(x, y);
        document.getElementById("addrXY_TWD97").innerHTML = "TWD97:<br>(" + TT.transResult.x + "," + TT.transResult.y+")";

    });
}

// 清空查詢結果及把marker隱藏
function clearLocate(){
    document.getElementById('address').value = '';
    document.getElementById('addrXY_WGS84').innerHTML = '';
    document.getElementById('addrXY_TWD97').innerHTML = '';
    locateMarker.setVisible(false);
}