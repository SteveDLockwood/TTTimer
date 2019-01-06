// reference some elements
var div_time // displays the current time
var timer_main // timer object for current time display
var button_clicks = [] // button click events
var riders = [] // list of rider objects (element 0 unused, element id = rider number)
var start_time = parseInt(new Date().getTime() / 3600000) * 3600000 // start time of event (in milliseconds)
var num_riders = 120 // number of riders
var start_time_offset = new Date(start_time).getTimezoneOffset() // need to make sure all times have the same offset

// parameters
var p_timer_interval = 100

// document load event
function doc_load() {
    // reference some elements
    time_display = document.getElementById("time_display")
    timer_main = window.setInterval(timer_main_event, p_timer_interval)
    // initialise the riders array
    for (i = 1; i <= num_riders; i++) {
        riders[i] = new Rider(i)
    }
    // display the start time
    $("#start_time").html(format_time(start_time))
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
        this.start_time = start_time + 60000 * n
        this.penalty = 0
        this.ignore = 0 // 1 = ignore, 2 = dns, 3 = dnf
        this._button_click_id = null
    }
    // get and set the event id
    get button_click_id() {return this._button_click_id}
    set button_click_id(id) {
        this._button_click_id = id
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
    return `
<div id="button_click_${eventid}" class="button_click assigned_${bc.rider_id ? 'yes' : 'no'} ignore_${bc.ignore ? 'yes' : 'no'}" onclick="time_event_click(${eventid})">
    <span class="event_id">${eventid}</span>:
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
}

// a time is clicked
function time_event_click(eventid) {
    // clear all actions
    $(".actions").text("")
    // get the event details and the div which holds it
    bc = button_clicks[eventid]
    div = $(`div#button_click_${eventid}`)
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
}
