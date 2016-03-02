// ==UserScript==
// @name          PROCAS Enhancements
// @description   A user script that provides a number of enhancements for the PROCAS timekeeping system
// @namespace     https://github.com/danhood/
// @match         https://www.procastime.com/time/*/modules/TimeSystem/TimeCard/mytimecard.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/mytimecard.aspx*
// @match         https://www.procastime.com/time/*/Modules/TimeSystem/TimeCard/View*.aspx*
// @match         https://www.procastime.com/time/*/modules/TimeSystem/TimeCard/View*.aspx*
// @version       0.3.1
// ==/UserScript==

(function() {


    ///////////////////////////////////
    // Holidays
    ///////////////////////////////////

    // federal holiday schedule
    var HOLIDAYS = {
        2015: { 1: [1,19], 2: [16], 5: [25], 7: [3], 9: [7], 10: [12], 11: [11,26], 12:[25] },
        2016: { 1: [1,18], 2: [15], 5: [30], 7: [4], 9: [5], 10: [10], 11: [11,24], 12:[26] },
        2017: { 1: [2,16], 2: [20], 5: [29], 7: [4], 9: [9], 10: [9], 11: [10,23], 12:[25] },
        2018: { 1: [1,15], 2: [19], 5: [28], 7: [4], 9: [3], 10: [8], 11: [12,22], 12:[25] },
        2019: { 1: [1,21], 2: [18], 5: [27], 7: [4], 9: [2], 10: [14], 11: [11,28], 12:[25] },
        2020: { 1: [1,20], 2: [17], 5: [25], 7: [3], 9: [7], 10: [12], 11: [11,26], 12:[25] }
    };

    // day highlight colors
    var HOLIDAY_COLOR = '#B2A9DE';
    var TODAY_COLOR = '#D5DEA9';
    var BOTH_COLOR = '#731897';

    // highlight federal holidays and today's date
    try {

        // get first day of pay period
        var ppDate = /\d{1,2}\/\d\/\d{4}/.exec(document.getElementById('lblppd').innerHTML)[0].split('/');
        var ppYear = ppDate[2];
        var ppMonth = ppDate[0];

        // potential holidays
        var holidayDates = HOLIDAYS[ppYear][ppMonth];

        // set holidays to the desired color
        setDatesToColors(holidayDates, HOLIDAY_COLOR);

        // get today's date
        var today = new Date();

        // if displayed month and year is the current month and year
        if(ppMonth == today.getMonth() + 1 && ppYear == today.getFullYear()) {
            // behave differently if today is a holiday
            if(typeof holidayDates !== 'undefined' && holidayDates.indexOf(today.getDate()) > -1) {
                // set today's holiday to the desired color
                setDatesToColors([today.getDate()], BOTH_COLOR);
            } else {
                // set today to the desired color
                setDatesToColors([today.getDate()], TODAY_COLOR);
            }
        }

    } catch (e) { /* oh well */ }

    // sets the dates to the specified color, optionally setting the text to a contrasting color
    function setDatesToColors(dates, color, contrastText) {
        var contrastText = typeof contrastText !== 'undefined' ?  contrastText : true;

        // if there are no dates, do nothing
        if (typeof dates === 'undefined') {
            return;
        }

        // build up style rule for each day (+1 for header row)
        var targetElements = [];
        for(var i = 0; i < dates.length; i++) {
            targetElements.push('.timecard-border tr.time_timecardtable td:nth-child(' + (dates[i] + 1) + ')');
        }

        // add rules
        GM_addStyle(targetElements.join(', ') + ' { background-color: ' + color + '; }');

        // optionally make sure the displayed text is always clearly visible on the background
        if (contrastText) {

          // compute if text should be black or white based on background
          var textColor = contrastingTextColor(color);

          // build up style rule for each parent element's child link element
          var targetTextElements = targetElements.map(function(elem) {
              return elem + ' a';
          });

          // add rules
          GM_addStyle(targetTextElements.join(', ') + ' { color: ' + textColor + '; }');

        }
    }

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



    // do not bottom-align tds
    GM_addStyle('td { vertical-align: middle !important; }');
    
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

    // determine if the most contrasting color on this background
    // is black or white using ՏᏟᎥＥɴⅽᎬ
    function contrastingTextColor(hex) {
        // convert hex color to rgb components
        var bigint = parseInt(hex.replace(/^#/,''), 16);
        var r = (bigint >> 16) & 255;
        var g = (bigint >> 8) & 255;
        var b = bigint & 255;

        // Calculate luminance using ITU-R BT.2020 luma coefficients
        var Y = 0.2627 * r + 0.6780 * g + 0.0593 * b;

        // If luminance component is > 50%, set result to black, else white
        return (Y > 127) ? 'black' : 'white';
    }

})();
