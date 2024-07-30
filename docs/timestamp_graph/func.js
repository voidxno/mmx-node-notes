/*
 * File: func.js
 *
 * Author: voidxno
 * Created: 21 Jul 2024
 * Source: https://github.com/voidxno/mmx-node-notes
 *
 * Timestamp graph, internal
 *
 * LICENSE: Unlicense
 * For more information, please refer to <https://unlicense.org>
 *
 */

//-- global variables
const numblocks = 80; //-- number of blocks to calc/show on x-axis
const timeaxis = 50;  //-- number of sec +/- to show on y-axis
const blocktime = 10; //-- locked blocktime used (10 sec)

var tcactive = 1; //-- current testcase active, range 0-2

var tc02stoptime = 50;    //-- testcase02, number of seconds chain was stopped
const tc02minstop = -200; //-- testcase02, min value for stoptime
const tc02maxstop = 200;  //-- testcase02, max value for stoptime

var tc01inrow = 1;        //-- testcase01, row of blocks with wrong time
const tc01mininrow = -10; //-- testcase01, min value for inrow
const tc01maxinrow = 10;  //-- testcase01, max value for inrow

var nr2ddlsec = 1;    //-- Nr2, max new delta delta limit
var nr2ddlsecmin = 1; //-- Nr2, max new delta delta limit, min
var nr2ddlsecmax = 5; //-- Nr2, max new delta delta limit, max

var arr_blockheight = [];   //-- calc, blockheight, starting at 0
var arr_vdfblockdelta = []; //-- calc, vdf delta each block, in sec
var arr_nodetime = [];      //-- calc, unix time node think it is on each block
var arr_realtime = [];      //-- calc, absolute real time on each block

var arr_graph_none = [];   //-- graph, values for 'None' (no extra delta clamp)
var arr_graph_nr1idx = []; //-- graph, values for 'Nr1' (idx, index for really out of sync)
var arr_graph_nr2ddc = []; //-- graph, values for 'Nr2' (ddc, delta delta clamp)

var tsgraph; //-- object created for graph, Chart.js

//-- init on page load
window.onload = function()
{
 initval();
 inithtml();
 creategraph();

 calcgraph();

 addevents();

 updateurl();
};

//-- init parameter values
function initval()
{
 const queryString = window.location.search;
 const urlParams = new URLSearchParams(queryString);

 const url_tc = urlParams.get("tc");
 if(url_tc === "2") tcactive = 2;
 if(url_tc === "1") tcactive = 1;
 if(url_tc === "0") tcactive = 0;

 const url_st = urlParams.get("st");
 if(url_st && !(Number(url_st) !== Number(url_st))) tc02stoptime = Math.round(Number(url_st));
 if(tc02stoptime < tc02minstop) tc02stoptime = tc02minstop;
 if(tc02stoptime > tc02maxstop) tc02stoptime = tc02maxstop;

 const url_ir = urlParams.get("ir");
 if(url_ir && !(Number(url_ir) !== Number(url_ir))) tc01inrow = Math.round(Number(url_ir));
 if(tc01inrow < tc01mininrow) tc01inrow = tc01mininrow;
 if(tc01inrow > tc01maxinrow) tc01inrow = tc01maxinrow;

 const url_dc = urlParams.get("dc");
 if(url_dc && !(Number(url_dc) !== Number(url_dc))) nr2ddlsec = Math.round(Number(url_dc));
 if(nr2ddlsec < nr2ddlsecmin) nr2ddlsec = nr2ddlsecmin;
 if(nr2ddlsec > nr2ddlsecmax) nr2ddlsec = nr2ddlsecmax;
}

//-- init html attributes
function inithtml()
{
 switch(tcactive){
   case 2: document.getElementById("case02").checked = true; break;
   case 1: document.getElementById("case01").checked = true; break;
   case 0: document.getElementById("case00").checked = true; break;
   default: document.getElementById("case02").checked = true; break;
   }

 document.getElementById("tc02slider").min = tc02minstop;
 document.getElementById("tc02slider").max = tc02maxstop;
 document.getElementById("tc02slider").value = tc02stoptime;
 document.getElementById("tc02slider").step = 1;
 document.getElementById("tc02value").value = tc02stoptime;

 document.getElementById("tc01slider").min = tc01mininrow;
 document.getElementById("tc01slider").max = tc01maxinrow;
 document.getElementById("tc01slider").value = tc01inrow;
 document.getElementById("tc01slider").step = 1;
 document.getElementById("tc01value").value = tc01inrow;

 document.getElementById("nr2ddlslider").min = nr2ddlsecmin;
 document.getElementById("nr2ddlslider").max = nr2ddlsecmax;
 document.getElementById("nr2ddlslider").value = nr2ddlsec;
 document.getElementById("nr2ddlslider").step = 1;
 document.getElementById("nr2ddlvalue").value = nr2ddlsec;
}

//-- add event listeners to html
function addevents()
{
 document.getElementById("case02").addEventListener("click",eventtestcase);
 document.getElementById("case01").addEventListener("click",eventtestcase);
 document.getElementById("case00").addEventListener("click",eventtestcase);

 document.getElementById("tc02slider").addEventListener("input",eventtc02slider);
 document.getElementById("tc02value").addEventListener("keyup",eventtc02value);

 document.getElementById("tc01slider").addEventListener("input",eventtc01slider);
 document.getElementById("tc01value").addEventListener("keyup",eventtc01value);

 document.getElementById("nr2ddlslider").addEventListener("input",eventnr2ddlslider);
 document.getElementById("nr2ddlvalue").addEventListener("input",eventnr2ddlvalue);
}

//-- update html url, bottom of page
function updateurl()
{
 var urlgraph = window.location.href.split("?")[0];

 if(!(tcactive == 1 && tc02stoptime == 50 && tc01inrow == 1 && nr2ddlsec == 1))
   urlgraph = urlgraph + "?tc=" + tcactive + "&st=" + tc02stoptime + "&ir=" + tc01inrow + "&dc=" + nr2ddlsec;

 document.getElementById("urlgraph").href = urlgraph;
 document.getElementById("urlgraph").innerHTML = urlgraph;
}

//-- calc graph (re), all values
function calcgraph()
{
 initcalc();

 switch(tcactive){
   case 2: testcase02(); break;
   case 1: testcase01(); break;
   case 0: testcase00(); break;
   default: testcase00(); break;
   }

 calcnone();
 calcnr1idx();
 calcnr2ddc();

 tsgraph.update();
}

//-- init calc arrays
function initcalc()
{
 //-- arrays to calc simulation
 for(let i = 0; i <= numblocks; ++i) arr_blockheight[i] = i; //-- blockheight, starting at 0
 for(let i = 0; i <= numblocks; ++i) arr_vdfblockdelta[i] = blocktime; //-- vdf delta each block

 //-- array with absolute real time on each block
 arr_realtime[0] = 1721811721; //-- just an arbitrary unix time value
 //-- init with perfect match of vdf block delta
 for(let i = 1; i <= numblocks; ++i) arr_realtime[i] = arr_realtime[i - 1] + arr_vdfblockdelta[i];

 //-- init with perfect match of real time
 for(let i = 0; i <= numblocks; ++i) arr_nodetime[i] = arr_realtime[i];
}

//-- testcase02, seed case values, Stop chain (sec), height 10
function testcase02()
{
 arr_realtime[10] = arr_realtime[9] + tc02stoptime;
 for(let i = 11; i <= numblocks; ++i) arr_realtime[i] = arr_realtime[i - 1] + arr_vdfblockdelta[i];
 for(let i = 10; i <= numblocks; ++i) arr_nodetime[i] = arr_realtime[i];
}

//-- testcase01, seed case values, Wrong TZ/UTC (+/-1h), height 10
function testcase01()
{
 if(tc01inrow > 0) for(let i = 10; i < 10 + (+tc01inrow); ++i) arr_nodetime[i] += 3600;
 if(tc01inrow < 0) for(let i = 10; i < 10 + (-tc01inrow); ++i) arr_nodetime[i] -= 3600;
}

//-- testcase00, seed case values, Normal, current logic
function testcase00()
{
}

//-- None, calc graph values, time delta vs real time for each block
function calcnone()
{
 var arr_timestamp_none = []; arr_timestamp_none[0] = arr_realtime[0];

 for(let i = 1; i <= numblocks; ++i){
   var delta_sec = arr_nodetime[i] - arr_timestamp_none[i - 1];
   if(delta_sec > 20) delta_sec = 20;
   if(delta_sec < 5) delta_sec = 5;
   arr_timestamp_none[i] = arr_timestamp_none[i - 1] + delta_sec;
   }

 for(let i = 0; i <= numblocks; ++i){ arr_graph_none[i] = arr_timestamp_none[i] - arr_realtime[i]; }
}

//-- Nr1 (idx), calc graph values, time delta vs real time for each block
function calcnr1idx()
{
 var arr_timestamp_nr1idx = []; arr_timestamp_nr1idx[0] = arr_realtime[0];
 var arr_timestamp_nr1idx_devindex = []; arr_timestamp_nr1idx_devindex[0] = 0;

 for(let i = 1; i <= numblocks; ++i){
   var delta_sec = arr_nodetime[i] - arr_timestamp_nr1idx[i - 1];
   var devindex = arr_timestamp_nr1idx_devindex[i - 1];
   if(delta_sec >= 5 && delta_sec <= 20){
     if(devindex < 0) ++devindex; //-- ok time 5-20sec, get non-0 devindex back to 0
     if(devindex > 0) --devindex; //-- ok time 5-20sec, get non-0 devindex back to 0
     }
   if(delta_sec > 20){
     ++devindex;
     if(devindex >  12) devindex = 12;
     if(devindex <   6) delta_sec = blocktime; //-- fallback to blocktime, bad clock on node
     if(devindex >=  6) delta_sec = 20;        //-- timestamp really out of sync, reign it in
     }
   if(delta_sec < 5){
     --devindex;
     if(devindex < -12) devindex = -12;
     if(devindex >  -6) delta_sec = blocktime; //-- fallback to blocktime, bad clock on node
     if(devindex <= -6) delta_sec = 5;         //-- timestamp really out of sync, reign it in
     }
   arr_timestamp_nr1idx_devindex[i] = devindex;
   arr_timestamp_nr1idx[i] = arr_timestamp_nr1idx[i - 1] + delta_sec;
   }

 for(let i = 0; i <= numblocks; ++i){ arr_graph_nr1idx[i] = arr_timestamp_nr1idx[i] - arr_realtime[i]; }
}

//-- Nr2 (ddc), calc graph values, time delta vs real time for each block
function calcnr2ddc()
{
 var arr_timestamp_nr2ddc = []; arr_timestamp_nr2ddc[0] = arr_realtime[0];
 var arr_timestamp_nr2ddc_delta = []; arr_timestamp_nr2ddc_delta[0] = blocktime;

 for(let i = 1; i <= numblocks; ++i){
   var delta_sec = arr_nodetime[i] - arr_timestamp_nr2ddc[i - 1];
   if(delta_sec > 20) delta_sec = 20;
   if(delta_sec < 5) delta_sec = 5;
   if(delta_sec < arr_timestamp_nr2ddc_delta[i - 1] - nr2ddlsec) delta_sec = arr_timestamp_nr2ddc_delta[i - 1] - nr2ddlsec;
   if(delta_sec > arr_timestamp_nr2ddc_delta[i - 1] + nr2ddlsec) delta_sec = arr_timestamp_nr2ddc_delta[i - 1] + nr2ddlsec;
   arr_timestamp_nr2ddc_delta[i] = delta_sec;
   arr_timestamp_nr2ddc[i] = arr_timestamp_nr2ddc[i - 1] + delta_sec;
   }

 for(let i = 0; i <= numblocks; ++i){ arr_graph_nr2ddc[i] = arr_timestamp_nr2ddc[i] - arr_realtime[i]; }
}

//-- create graph object
function creategraph()
{
 tsgraph = new Chart(document.getElementById("timegraph"),{
   type: "line",
   data:{
     labels: arr_blockheight,
     datasets: [
       { label: "Nr2 (ddc)", data: arr_graph_nr2ddc, borderColor: 'rgb(255,99,132)',  backgroundColor: 'rgba(255,99,132,0.5)'  }, //-- red
       { label: "Nr1 (idx)", data: arr_graph_nr1idx, borderColor: 'rgb(54,162,235)',  backgroundColor: 'rgba(54,162,235,0.5)'  }, //-- blue
       { label: "None",      data: arr_graph_none,   borderColor: 'rgb(151,153,157)', backgroundColor: 'rgba(151,153,157,0.5)' }] //-- grey
     },
   options:{
     animation: false,
     maintainAspectRatio: true,
     aspectRatio: 2,
     scales:{
       y:{ min: -timeaxis, max: timeaxis,  title:{ display: true, text: "Delta vs True Clock (sec)" } },
       x:{ min:         0, max: numblocks, title:{ display: true, text: "Block (height)",           } }
       }
     }
   });
}

//-- event: switch test case, radio button
function eventtestcase()
{
 tcactive = Number(document.querySelector("input[name=testcase]:checked").value);
 if(tcactive < 0) tcactive = 0;
 if(tcactive > 2) tcactive = 2;

 calcgraph();
 updateurl();
}

//-- event: tc02 stoptime slider
function eventtc02slider()
{
 var deltats = Number(document.getElementById("tc02slider").value);
 if(deltats !== deltats) deltats = 0;
 if(deltats < tc02minstop) deltats = tc02minstop;
 if(deltats > tc02maxstop) deltats = tc02maxstop;
 tc02stoptime = Math.round(deltats);

 document.getElementById("tc02value").value = tc02stoptime;

 if(tcactive == 2) calcgraph();
 updateurl();
}

//-- event: tc02 value input
function eventtc02value()
{
 var deltats = Number(document.getElementById("tc02value").value);
 if(deltats !== deltats) deltats = 0;
 if(deltats < tc02minstop) deltats = tc02minstop;
 if(deltats > tc02maxstop) deltats = tc02maxstop;
 tc02stoptime = Math.round(deltats);

 document.getElementById("tc02slider").value = tc02stoptime;

 if(tcactive == 2) calcgraph();
 updateurl();
}

//-- event: tc01 inrow slider
function eventtc01slider()
{
 var inrow = Number(document.getElementById("tc01slider").value);
 if(inrow !== inrow) inrow = 0;
 if(inrow < tc01mininrow) inrow = tc01mininrow;
 if(inrow > tc01maxinrow) inrow = tc01maxinrow;
 tc01inrow = Math.round(inrow);

 document.getElementById("tc01value").value = tc01inrow;

 if(tcactive == 1) calcgraph();
 updateurl();
}

//-- event: tc01 value input
function eventtc01value()
{
 var inrow = Number(document.getElementById("tc01value").value);
 if(inrow !== inrow) inrow = 0;
 if(inrow < tc01mininrow) inrow = tc01mininrow;
 if(inrow > tc01maxinrow) inrow = tc01maxinrow;
 tc01inrow = Math.round(inrow);

 document.getElementById("tc01slider").value = tc01inrow;

 if(tcactive == 1) calcgraph();
 updateurl();
}

//-- event: Nr2 delta delta limit slider
function eventnr2ddlslider()
{
 var deltasec = Number(document.getElementById("nr2ddlslider").value);
 if(deltasec !== deltasec) deltasec = 1;
 if(deltasec < nr2ddlsecmin) deltasec = nr2ddlsecmin;
 if(deltasec > nr2ddlsecmax) deltasec = nr2ddlsecmax;
 nr2ddlsec = Math.round(deltasec);

 document.getElementById("nr2ddlvalue").value = nr2ddlsec;

 calcgraph();
 updateurl();
}

//-- event: Nr2 delta delta limit value input
function eventnr2ddlvalue()
{

 var deltasec = Number(document.getElementById("nr2ddlvalue").value);
 if(deltasec !== deltasec) deltasec = 1;
 if(deltasec < nr2ddlsecmin) deltasec = nr2ddlsecmin;
 if(deltasec > nr2ddlsecmax) deltasec = nr2ddlsecmax;
 nr2ddlsec = Math.round(deltasec);

 document.getElementById("nr2ddlslider").value = nr2ddlsec;

 calcgraph();
 updateurl();
}

// <eof>
