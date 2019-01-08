
// reference some elements as globals
var div_time // displays the current time
var timer_main // timer object for current time display
var button_clicks = [] // button click events
var riders = [] // list of rider objects (element 0 unused, element id = rider number)
var start_time = parseInt(new Date().getTime() / 3600000) * 3600000 // start time of event (in milliseconds)
var num_riders = 120 // number of riders
var start_time_offset = new Date(start_time).getTimezoneOffset() // need to make sure all times have the same offset

// parameters
var p_timer_interval = 100

// now load any saved globals
if (localStorage.getItem("globals")) {
    g = JSON.parse(localStorage.getItem("globals"))
    button_clicks = g.button_clicks
    riders = g.riders
    start_time = g.start_time
    num_riders = g.num_riders
    start_time_offset = g.start_time_offset
}

// save globals
function save_globals() {
    g = {
        "button_clicks": button_clicks,
        "riders": riders,
        "start_time": start_time,
        "num_riders": num_riders,
        "start_time_offset": start_time_offset
    }
    localStorage.setItem("globals", JSON.stringify(g))
}

// document load event
function doc_load() {
    // reference some elements
    time_display = document.getElementById("time_display")
    timer_main = window.setInterval(timer_main_event, p_timer_interval)
    // initialise the riders array
    for (i = 1; i <= num_riders; i++) {
        // create a new object if needed
        if (riders[i] == undefined) {
            riders[i] = new Rider(i)
        }
        // convert anonymous object to Rider
        if (typeof riders[i] == "object") {
            x = riders[i]
            riders[i] = new Rider(i)
            fields = ["penalty", "ignore", "_start_time", "button_click_id"]
            for (f in fields) {
                riders[i][fields[f]] = x[fields[f]]
            }
        }
    }
    // display the start time
    $("#start_time").html(format_time(start_time))
    // initialise the button_clicks array
    $("div#button_clicks").text("")
    for (i in button_clicks) {
        if (typeof button_clicks[i] == "object") {
            x = button_clicks[i]
            button_clicks[i] = new ButtonClick(x.d)
            fields = ["ignore", "_rider_id"]
            for (f in fields) {
                button_clicks[i][fields[f]] = x[fields[f]]
            }
        }
        $("div#button_clicks").prepend(html_button_click(i))
    }
}

// timer event
function timer_main_event() {
    d = new Date().getTime()
    $(time_display).html(format_time(d))
}

// formats a time as hh:mm:ss.ddd (time is in milliseconds)
function format_time(ms) {
    // make sure the time is using the same offset as the event start time - adjust if necessary
    t = new Date(ms)
    o = t.getTimezoneOffset()
    t = new Date(ms + (o - start_time_offset) * 60000)
    // 
    d = t.toDateString()
    h = (t.getHours()+100).toString().substring(1)
    m = (t.getMinutes()+100).toString().substring(1)
    s = (t.getSeconds()+100).toString().substring(1)
    ms = (t.getMilliseconds()+1000).toString().substring(1)
    return `
<span class="date">${d}</span>
<span class="time">
    <span class="hours">${h}</span>:<span class="minutes">${m}</span>:<span class="seconds">${s}</span>.<span class="milliseconds">${ms}</span>
</span>`
}

// button_click object
class ButtonClick {
    constructor(d) {
        this.d = d
        this.hms = format_time(this.d)
        this.ignore = false
        this._rider_id = null
    }
    // get and set the rider id
    get rider_id() {return this._rider_id}
    set rider_id(id) {
        this._rider_id = id
    }
}


//rider object
class Rider {
    constructor(n) {
        this.n = n
        this._start_time = null
        this.penalty = 0
        this.ignore = 0 // 1 = ignore, 2 = dns, 3 = dnf
        this.button_click_id = null
    }
    // get the start time (default if not set)
    get start_time() {
        if (this._start_time == null) {
            return start_time + 60000 * this.n
        }
        else {
            return this._start_time
        }
    }
    set start_time(d) {
        this._start_time = d
    }
    // get the time
    get time() {
        if (this.button_click_id == null) {
            return null
        }
        else {
            bc = button_clicks[this.button_click_id]
            let t = bc.d
            let st = this.start_time
            let p = this.penalty
            let ti = t - st + p
            return ti
        }
    }
    // get the time formatted
    get time_string() {
        let ti = this.time
        if (ti == null) {
            return ""
        }
        else {
            return format_time(ti)
        }
    }
    // get the penalty
    get penalty_string() {
        if (!this.penalty) {
            return ''
        }
        else {
            let ps = format_time(this.penalty)
            return `(inludes ${ps} penalty)`
        }
    }
}

// html for a button click
function html_button_click(eventid) {
    bc = button_clicks[eventid]
    rid = bc.rider_id
    rt = rid !=null ? riders[rid].time_string : ''
    pt = rid != null ? riders[rid].penalty_string : ''
    did = 0 + parseInt(eventid) + 1
    return `
<div id="button_click_${eventid}" class="button_click assigned_${bc.rider_id ? 'yes' : 'no'} ignore_${bc.ignore ? 'yes' : 'no'}" onclick="time_event_click(${eventid})">
    <span class="event_id">${did}</span>
    <span class="hms">${bc.hms}</span> - 
    Rider: <span class="rider_id">${rid}</span>
    Time: <span class="rider_time">${rt}</span>
    <span class="rider_penalty">${pt}</span>
    <div class="actions" />
</div>`
}

// timer button click event
function time_button_click(e) {
    // create a ButtonClick object
    d = new Date().getTime()
    bc = new ButtonClick(d)
    button_clicks.push(bc)
    i = button_clicks.length - 1
    // add it to the display
    $("div#button_clicks").prepend(html_button_click(i))
    time_event_click(i)
    save_globals()
}

// a time is clicked
function time_event_click(eventid) {
    // get the event details and the div which holds it
    bc = button_clicks[eventid]
    div = $(`div#button_click_${eventid}`)
    text = $(div).find(".actions").text()
    // clear all actions
    $(".actions").text("")
    // return if clicked when actions were displayed
    if (text) {return}
    // set the actions
    html = ``
    if (bc.ignore) {
        // ad unignore option
        html = html + `<input type="button" value="Un-Ignore" onclick="ignore_event(${eventid}, false)" /> `
    }
    else {
        if (bc.rider_id) {
            // add deallocate option
            html = html + `<input type="button" value="Remove[${bc.rider_id}]" onclick="allocate_event(${eventid}, null)" /> `
        }
        else {
            // add an ignore option
            html = html + `<input type="button" value="Ignore" onclick="ignore_event(${eventid}, true)" /> `
        }
        // display available numbers
        for (i = 1; i <= num_riders; i++) {
            if (!riders[i].ignore && riders[i].button_click_id == null) {
                html = html + `<input type="button" value="${i}" onclick="allocate_event(${eventid}, ${i})" /> `
            }
        }
    }
    // display the actions
    $(div).find(".actions").html(html)
}

// refresh button click display
function refresh_button_click(eid) {
    $(`div#button_click_${eid}`).replaceWith(html_button_click(eid))
}

// set the ignore flag on a button click event
function ignore_event(eventid, v) {
    button_clicks[eventid].ignore = v
    refresh_button_click(eventid)
    save_globals()
}

// allocate button click to an event
function allocate_event(eid, rid) {
    // clear any existing allocation
    r1 = button_clicks[eid].rider_id
    if (r1 != null) {
        riders[r1].button_click_id = null
    }
    // set new allocation
    button_clicks[eid].rider_id = rid
    if (rid != null) {
        riders[rid].button_click_id = eid
    }
    refresh_button_click(eid)
    save_globals()
}

// setup
function setup() {
    $("#setup").show()
    sth = new Date(start_time).getHours()
    stm = new Date(start_time).getMinutes()
    sts = new Date(start_time).getSeconds()
    var wp_options = {
        now: `${sth}:${stm}`, //hh:mm 24 hour format only, defaults to current time
        twentyFour: true,  //Display 24 hour format, defaults to false
        //upArrow: 'wickedpicker__controls__control-up',  //The up arrow class selector to use, for custom CSS
        //downArrow: 'wickedpicker__controls__control-down', //The down arrow class selector to use, for custom CSS
        close: 'wickedpicker__close', //The close class selector to use, for custom CSS
        hoverState: 'hover-state', //The hover state class to use, for custom CSS
        title: 'Set start time', //The Wickedpicker's title,
        showSeconds: true, //Whether or not to show seconds,
        timeSeparator: ':', // The string to put in between hours and minutes (and seconds)
        secondsInterval: 1, //Change interval for seconds, defaults to 1,
        minutesInterval: 1, //Change interval for minutes, defaults to 1
        beforeShow: null, //A function to be called before the Wickedpicker is shown
        afterShow: null, //A function to be called after the Wickedpicker is closed/hidden
        show: null, //A function to be called when the Wickedpicker is shown
        clearable: false, //Make the picker's input clearable (has clickable "x")
    };
    $("#setup_start_time").wickedpicker(wp_options)
}

// reset
function reset() {
    $("#reset_check").toggle()
}
function reset2() {
    button_clicks = [] // button click events
    riders = [] // list of rider objects (element 0 unused, element id = rider number)
    start_time = parseInt(new Date().getTime() / 3600000) * 3600000 // start time of event (in milliseconds)
    num_riders = 120 // number of riders
    start_time_offset = new Date(start_time).getTimezoneOffset() // need to make sure all times have the same offset
    save_globals()
    doc_load()
    $("#reset_check").hide()
}


// set start time
function set_start_time() {
    t = $("#setup_start_time").wickedpicker("time")
    h = parseInt(t.substring(0,2))
    m = parseInt(t.substring(3,5))
    s = parseInt(t.substring(6,8))
    d = new Date()
    d.setHours(h)
    d.setMinutes(m)
    d.setSeconds(s)
    d.setMilliseconds(0)
    start_time = d.getTime()
    save_globals()
    doc_load()
    setup()
}

// finished setup
function setup_close() {
    $("#setup").hide()
}
