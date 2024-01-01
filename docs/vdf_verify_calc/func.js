/*
 * File: func.js
 *
 * Author: voidxno
 * Created: 02 Jan 2024
 * Source: https://github.com/voidxno/mmx-node-notes
 *
 * VDF Verify Calculator
 *
 * LICENSE: Unlicense
 * For more information, please refer to <https://unlicense.org>
 *
 */

window.onload = function(){ initval(); calcvdf(); };

function initval()
{
 const queryString = window.location.search;
 const urlParams = new URLSearchParams(queryString);

 const networkspeed = urlParams.get("ns");
 const verifytime = urlParams.get("vt");
 const withreward = (urlParams.get("wr") == 0) ? 0 : 1;

 document.getElementById("networkspeed").value = networkspeed;
 document.getElementById("verifytime").value = verifytime;
 document.getElementById("withreward").checked = (withreward == 0) ? false : true;
}

function calcvdf()
{
 var networkspeed = Number(document.getElementById("networkspeed").value);
 var verifytime = Number(document.getElementById("verifytime").value);
 var withreward = document.getElementById("withreward").checked;

 if(networkspeed !== networkspeed) networkspeed = 0;
 if(verifytime !== verifytime) networkspeed = 0;
 withreward = (withreward == true) ? 1 : 0;

 var max3xvdfspeed = (withreward) ? (networkspeed / verifytime) * 5 : (((networkspeed / verifytime) * 5) * 2) / 3;
 var max2xvdfspeed = (withreward) ? (((networkspeed / verifytime) * 5) * 3) / 2 : (networkspeed / verifytime) * 5;

 max3xvdfspeed = (networkspeed <= 0 || verifytime <= 0) ? "n/a" : (Math.round(max3xvdfspeed * 10) / 10).toFixed(1);
 max2xvdfspeed = (networkspeed <= 0 || verifytime <= 0) ? "n/a" : (Math.round(max2xvdfspeed * 10) / 10).toFixed(1);

 document.getElementById("max3xvdfspeed").innerHTML = max3xvdfspeed;
 document.getElementById("max2xvdfspeed").innerHTML = max2xvdfspeed;

 var urlcalc = window.location.href.split("?")[0];
 if(networkspeed > 0 && verifytime > 0) urlcalc = urlcalc + "?ns=" + networkspeed + "&vt=" + verifytime + "&wr=" + withreward;
 document.getElementById("urlcalc").href = urlcalc;
 document.getElementById("urlcalc").innerHTML = urlcalc;
}

// <eof>
