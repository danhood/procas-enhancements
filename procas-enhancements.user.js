// ==UserScript==
// @name          PROCAS Enhancements
// @description   A user script that provides a number of enhancements for the PROCAS timekeeping system
// @namespace     https://github.com/danhood/
// @match         https://www.procastime.com/time/*/modules/TimeSystem/TimeCard/mytimecard.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/mytimecard.aspx*
// @match         https://www.procastime.com/time/*/modules/TimeSystem/TimeCard/ViewReadOnly.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/ViewReadOnly.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/ViewTimeCardPMgr.aspx*
// @version       0.2
// ==/UserScript==

(function() {


    ///////////////////////////////////
    // Holidays
    ///////////////////////////////////
    
    // federal holiday schedule
    var HOLIDAYS = {
        2015: { 1: [1,19], 2: [16], 5: [25], 7: [3], 9: [7], 10: [12], 11: [11,26], 12:[25] },
        2016: { 1: [1,18], 2: [15], 5: [30], 7: [4], 9: [5], 10: [10], 11: [11,24], 12:[26] },
        2017: { 1: [2,16], 2: [20], 5: [29], 7: [4], 9: [9], 10: [9], 11: [10,23], 12:[25] }
    };

    // highlight federal holidays
    try {

        // get first day of pay period
        var date = /\d{1,2}\/\d\/\d{4}/.exec(document.getElementById('lblppd').innerHTML)[0].split('/');

        // potential holidays
        var dates = HOLIDAYS[date[2]][date[0]];

        // build up style rule for each day (+1 for header row)
        var holidays = [];
        for(var i = 0; i < dates.length; i++) {
            holidays.push('.timecard-border tr.time_timecardtable td:nth-child(' + (dates[i] + 1) + ')');
        }

        // add rules
        GM_addStyle(holidays.join(', ') + ' { background-color: #B2A9DE; }');

    } catch (e) { /* oh well */ }


    ///////////////////////////////////
    // Hiding long descriptions
    ///////////////////////////////////

    // better borders
    GM_addStyle('#dgTimeCard td { border: 1px solid gray; }');
    
    // style for hiding long descriptions
    GM_addStyle('body.hideLongDescs .time_timecardtableDesc { display: none; }');


    ///////////////////////////////////
    // Bottom bar
    ///////////////////////////////////

    // build bottom bar
    var body = document.getElementsByTagName('body')[0];
    var fixBar = document.createElement('div');
    fixBar.setAttribute('class', 'fixbar');
    GM_addStyle('body { padding-bottom: 50px !important; }'); 
    GM_addStyle('.fixbar { position:fixed; width:100%; bottom: 0; left: 0; right: 0; ' +
        '-moz-box-sizing: border-box; -webkit-box-sizing: border-box; box-sizing: border-box; ' +
        'line-height: 50px; background-color: #00385e; color: #eee; padding: 0 20px; }');
    body.appendChild(fixBar);


    ///////////////////////////////////
    // Show/Hide row 
    ///////////////////////////////////

    // checkbox to hide long descs
    var checkLabel = document.createElement('label');
    checkLabel.innerHTML = '<input type="checkbox" id="hideLongDescs" /> Hide Long Descriptions';
    fixBar.appendChild(checkLabel);

    // bind events to input - note using localStorage as GM_(set|get)Value not there in Chrome
    var hideLongDescs = document.getElementById('hideLongDescs');
    hideLongDescs.addEventListener('click', function() {
      body.className = this.checked ? 'hideLongDescs' : ' ';
      localStorage.setItem('hideLongDescs', this.checked);
    });
    if(localStorage.getItem('hideLongDescs') === 'true') {
        hideLongDescs.checked = true;
        body.className = 'hideLongDescs';
    }
    

    ///////////////////////////////////
    // Hours worked, needed, remaining
    ///////////////////////////////////
   
    var HOURS = [
        [152,168], // Jan
        [160,168], // Feb 
        [184,184], // Mar
        [168,168], // Apr
        [168,176], // May
        [176,176], // Jun
        [160,168], // Jul
        [184,184], // Aug
        [168,176], // Sep
        [160,168], // Oct
        [160,176], // Nov
        [168,176]  // Dec
    ];

    // hours info
    var totalHrs = document.querySelector('.timecard-border .time_timecardtable').querySelectorAll('td:not([class])').length * 8;
    var hrsWorked = parseFloat(document.querySelector('.time_timecardtableTotal').parentNode.querySelector('td:last-child').innerHTML);
    var hoursDiv = document.createElement('div');
    hoursDiv.style.cssFloat = 'right';
    hoursDiv.innerHTML = fmt(hrsWorked) + ' of ' + fmt(totalHrs) + ' hrs worked (' + fmt(totalHrs - hrsWorked) + ' hrs needed)';
    fixBar.appendChild(hoursDiv);


    // format to 1 decimal place, shorthand
    function fmt(num) {
        return num.toFixed(1);
    }
    
})();
