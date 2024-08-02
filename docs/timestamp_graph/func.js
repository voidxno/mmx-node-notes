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

var gptoggle_nr2ddc = 1; //-- graph, toggle on/off graph 'Nr2'
var gptoggle_nr1idx = 0; //-- graph, toggle on/off graph 'Nr1'
var gptoggle_none = 1;   //-- graph, toggle on/off graph 'None'

var gp02inrow = 1;        //-- graphparam02, row of blocks with wrong time
const gp02mininrow = -10; //-- graphparam02, min value for inrow
const gp02maxinrow = 10;  //-- graphparam02, max value for inrow

var gp01stoptime = 0;     //-- graphparam01, number of seconds to stop chain
const gp01minstop = -200; //-- graphparam01, min value for stoptime
const gp01maxstop = 200;  //-- graphparam01, max value for stoptime

var nr2ddlincsec = 1; //-- Nr2, max new delta delta limit (inc)
var nr2ddldecsec = 1; //-- Nr2, max new delta delta limit (dec)
var nr2ddlsecmin = 1; //-- Nr2, max new delta delta limit, min
var nr2ddlsecmax = 5; //-- Nr2, max new delta delta limit, max

var arr_blockheight = [];   //-- calc, blockheight, starting at 0
var arr_vdfblockdelta = []; //-- calc, vdf delta each block, in sec
var arr_nodetime = [];      //-- calc, unix time node think it is on each block
var arr_realtime = [];      //-- calc, absolute real time on each block

var arr_graph_nr2ddc = []; //-- graph, values for 'Nr2' (ddc, delta delta clamp)
var arr_graph_nr1idx = []; //-- graph, values for 'Nr1' (idx, index for really out of sync)
var arr_graph_none = [];   //-- graph, values for 'None' (no extra delta clamp)

var tsgraph; //-- object created for graph, Chart.js

//-- init on page load
window.onload = function()
{
 initval();
 inithtml();
 creategraph();

 calcgraph();

 addevents();
};

//-- init parameter values
function initval()
{
 const queryString = window.location.search;
 const urlParams = new URLSearchParams(queryString);

 const url_ir = urlParams.get("ir");
 if(url_ir && !(Number(url_ir) !== Number(url_ir))) gp02inrow = Math.round(Number(url_ir));
 if(gp02inrow < gp02mininrow) gp02inrow = gp02mininrow;
 if(gp02inrow > gp02maxinrow) gp02inrow = gp02maxinrow;

 const url_st = urlParams.get("st");
 if(url_st && !(Number(url_st) !== Number(url_st))) gp01stoptime = Math.round(Number(url_st));
 if(gp01stoptime < gp01minstop) gp01stoptime = gp01minstop;
 if(gp01stoptime > gp01maxstop) gp01stoptime = gp01maxstop;

 const url_dci = urlParams.get("dci");
 if(url_dci && !(Number(url_dci) !== Number(url_dci))) nr2ddlincsec = Math.round(Number(url_dci));
 if(nr2ddlincsec < nr2ddlsecmin) nr2ddlincsec = nr2ddlsecmin;
 if(nr2ddlincsec > nr2ddlsecmax) nr2ddlincsec = nr2ddlsecmax;

 const url_dcd = urlParams.get("dcd");
 if(url_dcd && !(Number(url_dcd) !== Number(url_dcd))) nr2ddldecsec = Math.round(Number(url_dcd));
 if(nr2ddldecsec < nr2ddlsecmin) nr2ddldecsec = nr2ddlsecmin;
 if(nr2ddldecsec > nr2ddlsecmax) nr2ddldecsec = nr2ddlsecmax;

 const url_t2 = urlParams.get("t2");
 if(url_t2 && !(Number(url_t2) !== Number(url_t2))) gptoggle_nr2ddc = Math.round(Number(url_t2));
 gptoggle_nr2ddc = (gptoggle_nr2ddc) ? 1 : 0;

 const url_t1 = urlParams.get("t1");
 if(url_t1 && !(Number(url_t1) !== Number(url_t1))) gptoggle_nr1idx = Math.round(Number(url_t1));
 gptoggle_nr1idx = (gptoggle_nr1idx) ? 1 : 0;

 const url_t0 = urlParams.get("t0");
 if(url_t0 && !(Number(url_t0) !== Number(url_t0))) gptoggle_none = Math.round(Number(url_t0));
 gptoggle_none = (gptoggle_none) ? 1 : 0;
}

//-- init html attributes
function inithtml()
{
 document.getElementById("gp01slider").min = gp01minstop;
 document.getElementById("gp01slider").max = gp01maxstop;
 document.getElementById("gp01slider").value = gp01stoptime;
 document.getElementById("gp01slider").step = 1;
 document.getElementById("gp01value").value = gp01stoptime;

 document.getElementById("gp02slider").min = gp02mininrow;
 document.getElementById("gp02slider").max = gp02maxinrow;
 document.getElementById("gp02slider").value = gp02inrow;
 document.getElementById("gp02slider").step = 1;
 document.getElementById("gp02value").value = gp02inrow;

 document.getElementById("nr2incslider").min = nr2ddlsecmin;
 document.getElementById("nr2incslider").max = nr2ddlsecmax;
 document.getElementById("nr2incslider").value = nr2ddlincsec;
 document.getElementById("nr2incslider").step = 1;
 document.getElementById("nr2incvalue").value = nr2ddlincsec;

 document.getElementById("nr2decslider").min = nr2ddlsecmin;
 document.getElementById("nr2decslider").max = nr2ddlsecmax;
 document.getElementById("nr2decslider").value = nr2ddldecsec;
 document.getElementById("nr2decslider").step = 1;
 document.getElementById("nr2decvalue").value = nr2ddldecsec;
}

//-- add event listeners to html
function addevents()
{
 document.getElementById("gp01slider").addEventListener("input",eventgp01slider);
 document.getElementById("gp01value").addEventListener("keyup",eventgp01value);

 document.getElementById("gp02slider").addEventListener("input",eventgp02slider);
 document.getElementById("gp02value").addEventListener("keyup",eventgp02value);

 document.getElementById("nr2incslider").addEventListener("input",eventnr2incslider);
 document.getElementById("nr2incvalue").addEventListener("input",eventnr2incvalue);

 document.getElementById("nr2decslider").addEventListener("input",eventnr2decslider);
 document.getElementById("nr2decvalue").addEventListener("input",eventnr2decvalue);
}

//-- update html url, bottom of page
function updateurl()
{
 gptoggle_nr2ddc = (tsgraph.getDatasetMeta(0).hidden ) ? 0 : 1;
 gptoggle_nr1idx = (tsgraph.getDatasetMeta(1).hidden ) ? 0 : 1;
 gptoggle_none   = (tsgraph.getDatasetMeta(2).hidden ) ? 0 : 1;

 var urlgraph = window.location.href.split("?")[0];
 if(!(gp02inrow == 1
   && gp01stoptime == 0
   && nr2ddlincsec == 1
   && nr2ddldecsec == 1
   && gptoggle_nr2ddc == 1
   && gptoggle_nr1idx == 0
   && gptoggle_none == 1))
   urlgraph = urlgraph
     + "&ir=" + gp02inrow
     + "&st=" + gp01stoptime
     + "&dci=" + nr2ddlincsec
     + "&dcd=" + nr2ddldecsec
     + "&t2=" + gptoggle_nr2ddc
     + "&t1=" + gptoggle_nr1idx
     + "&t0=" + gptoggle_none;

 document.getElementById("urlgraph").href = urlgraph;
 document.getElementById("urlgraph").innerHTML = urlgraph;
}

//-- calc graph (re), all values
function calcgraph()
{
 initcalc();

 calcseed();

 calcnone();
 calcnr1idx();
 calcnr2ddc();

 tsgraph.update();
 updateurl();
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

//-- graph params, seed values, depending on parameters
function calcseed()
{
 //-- gp02, seed values, stop chain (sec), height 10
 for(let i = 10; i <= numblocks; ++i) arr_realtime[i] += gp01stoptime;
 for(let i = 10; i <= numblocks; ++i) arr_nodetime[i] = arr_realtime[i];

 //-- gp01, seed values, wrong TZ/UTC (+/-1h), height 10
 if(gp02inrow > 0) for(let i = 10; i < 10 + (+gp02inrow); ++i) arr_nodetime[i] += 3600;
 if(gp02inrow < 0) for(let i = 10; i < 10 + (-gp02inrow); ++i) arr_nodetime[i] -= 3600;
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

   const prev_delta_sec = arr_timestamp_nr2ddc_delta[i - 1];

   if(nr2ddlincsec == nr2ddldecsec){ //-- identical up/down delta delta limit
     const deltalimit = nr2ddlincsec;
     if(delta_sec < prev_delta_sec - deltalimit) delta_sec = prev_delta_sec - deltalimit;
     if(delta_sec > prev_delta_sec + deltalimit) delta_sec = prev_delta_sec + deltalimit;
     }

   if(nr2ddlincsec != nr2ddldecsec){ //-- diff up/down delta delta limit against 10 sec static blocktime
     const deltalimit_inc = nr2ddlincsec;
     const deltalimit_dec = nr2ddldecsec;
     if(prev_delta_sec > blocktime){
       if(delta_sec > prev_delta_sec + deltalimit_inc) delta_sec = prev_delta_sec + deltalimit_inc;
       if(delta_sec < prev_delta_sec - deltalimit_dec) delta_sec = prev_delta_sec - deltalimit_dec;
       }
     if(prev_delta_sec < blocktime){
       if(delta_sec < prev_delta_sec - deltalimit_inc) delta_sec = prev_delta_sec - deltalimit_inc;
       if(delta_sec > prev_delta_sec + deltalimit_dec) delta_sec = prev_delta_sec + deltalimit_dec;
       }
     if(prev_delta_sec == blocktime){
       if(delta_sec < prev_delta_sec - deltalimit_inc) delta_sec = prev_delta_sec - deltalimit_inc;
       if(delta_sec > prev_delta_sec + deltalimit_inc) delta_sec = prev_delta_sec + deltalimit_inc;
       }
     }

   arr_timestamp_nr2ddc_delta[i] = delta_sec;
   arr_timestamp_nr2ddc[i] = arr_timestamp_nr2ddc[i - 1] + delta_sec;
   }

 for(let i = 0; i <= numblocks; ++i){ arr_graph_nr2ddc[i] = arr_timestamp_nr2ddc[i] - arr_realtime[i]; }
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

 tsgraph.setDatasetVisibility(0,(gptoggle_nr2ddc) ? true : false);
 tsgraph.setDatasetVisibility(1,(gptoggle_nr1idx) ? true : false);
 tsgraph.setDatasetVisibility(2,(gptoggle_none)   ? true : false);
}

//-- event: gp02 inrow slider
function eventgp02slider()
{
 var inrow = Number(document.getElementById("gp02slider").value);
 if(inrow !== inrow) inrow = 0;
 if(inrow < gp02mininrow) inrow = gp02mininrow;
 if(inrow > gp02maxinrow) inrow = gp02maxinrow;
 gp02inrow = Math.round(inrow);

 document.getElementById("gp02value").value = gp02inrow;

 calcgraph();
}

//-- event: gp02 value input
function eventgp02value()
{
 var inrow = Number(document.getElementById("gp02value").value);
 if(inrow !== inrow) inrow = 0;
 if(inrow < gp02mininrow) inrow = gp02mininrow;
 if(inrow > gp02maxinrow) inrow = gp02maxinrow;
 gp02inrow = Math.round(inrow);

 document.getElementById("gp02slider").value = gp02inrow;

 calcgraph();
}

//-- event: gp01 stoptime slider
function eventgp01slider()
{
 var deltats = Number(document.getElementById("gp01slider").value);
 if(deltats !== deltats) deltats = 0;
 if(deltats < gp01minstop) deltats = gp01minstop;
 if(deltats > gp01maxstop) deltats = gp01maxstop;
 gp01stoptime = Math.round(deltats);

 document.getElementById("gp01value").value = gp01stoptime;

 calcgraph();
}

//-- event: gp01 value input
function eventgp01value()
{
 var deltats = Number(document.getElementById("gp01value").value);
 if(deltats !== deltats) deltats = 0;
 if(deltats < gp01minstop) deltats = gp01minstop;
 if(deltats > gp01maxstop) deltats = gp01maxstop;
 gp01stoptime = Math.round(deltats);

 document.getElementById("gp01slider").value = gp01stoptime;

 calcgraph();
}

//-- event: Nr2 delta delta limit slider (inc)
function eventnr2incslider()
{
 var deltasec = Number(document.getElementById("nr2incslider").value);
 if(deltasec !== deltasec) deltasec = 1;
 if(deltasec < nr2ddlsecmin) deltasec = nr2ddlsecmin;
 if(deltasec > nr2ddlsecmax) deltasec = nr2ddlsecmax;
 nr2ddlincsec = Math.round(deltasec);

 document.getElementById("nr2incvalue").value = nr2ddlincsec;

 calcgraph();
}

//-- event: Nr2 delta delta limit value input (inc)
function eventnr2incvalue()
{
 var deltasec = Number(document.getElementById("nr2incvalue").value);
 if(deltasec !== deltasec) deltasec = 1;
 if(deltasec < nr2ddlsecmin) deltasec = nr2ddlsecmin;
 if(deltasec > nr2ddlsecmax) deltasec = nr2ddlsecmax;
 nr2ddlincsec = Math.round(deltasec);

 document.getElementById("nr2incslider").value = nr2ddlincsec;

 calcgraph();
}

//-- event: Nr2 delta delta limit slider (dec)
function eventnr2decslider()
{
 var deltasec = Number(document.getElementById("nr2decslider").value);
 if(deltasec !== deltasec) deltasec = 1;
 if(deltasec < nr2ddlsecmin) deltasec = nr2ddlsecmin;
 if(deltasec > nr2ddlsecmax) deltasec = nr2ddlsecmax;
 nr2ddldecsec = Math.round(deltasec);

 document.getElementById("nr2decvalue").value = nr2ddldecsec;

 calcgraph();
}

//-- event: Nr2 delta delta limit value input (dec)
function eventnr2decvalue()
{
 var deltasec = Number(document.getElementById("nr2decvalue").value);
 if(deltasec !== deltasec) deltasec = 1;
 if(deltasec < nr2ddlsecmin) deltasec = nr2ddlsecmin;
 if(deltasec > nr2ddlsecmax) deltasec = nr2ddlsecmax;
 nr2ddldecsec = Math.round(deltasec);

 document.getElementById("nr2decslider").value = nr2ddldecsec;

 calcgraph();
}

// <eof>
