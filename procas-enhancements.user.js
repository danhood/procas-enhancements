// ==UserScript==
// @name          PROCAS Enhancements
// @description   A user script that provides a number of enhancements for the PROCAS timekeeping system
// @namespace     https://github.com/danhood/
// @match         https://www.procastime.com/time/*/modules/TimeSystem/TimeCard/mytimecard.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/mytimecard.aspx*
// @match         https://www.procastime.com/time/*/modules/TimeSystem/TimeCard/ViewReadOnly.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/ViewReadOnly.aspx*
// @version       0.1
// ==/UserScript==

(function() {


    ///////////////////////////////////
    // Holidays
    ///////////////////////////////////
    
    // federal holiday schedule
    var HOLIDAYS = {
        2013: { 1: [1,21], 2: [18], 5: [27], 7: [4], 9: [2], 10: [14], 11: [11,28], 12:[25] },
        2014: { 1: [1,20], 2: [17], 5: [26], 7: [4], 9: [1], 10: [13], 11: [11,27], 12:[25] }
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
        GM_addStyle(holidays.join(', ') + ' { background-color: #fff7d7; }');

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
