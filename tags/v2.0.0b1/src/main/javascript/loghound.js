/**
 * Software License Agreement (Apache License 2.0)
 *
 * Copyright (c) 2010,  Facets Technologies, Inc.
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 * -----------------------------------------------------------------------------
 *
 * LogHound is a Javascript logger you can use to gain insight into what is
 * going on in your Javascript code.
 *
 * ['text',LogHoundLevels['DEBUG'],{'tags','group1 group2'},errorObj]
 *
 */
var LogHoundVer = new Array();
LogHoundVer['major'] = '2';
LogHoundVer['minor'] = '0';
LogHoundVer['fix'] = '0';
LogHoundVer['build'] = '$Rev: 116 $';
if(LogHoundVer['build'].length>5) {
    LogHoundVer['build'] = LogHoundVer['build'].substring(5).split(' ')[1];
} else {
    LogHoundVer['build'] = '-';
}
LogHoundVer['release'] = 'beta 1';
LogHoundVer.getLongText = function() {
    return this.major+'.'+this.minor+'.'+this.fix+'.'+this.build+' '+this.release;
};
LogHoundVer.getShortText = function() {
    return 'v'+this.major+'.'+this.minor+'.'+this.fix+' '+this.release;
};
/**
 * Object array defining all the log level objects and their specific attributes.
 */
var LogHoundLevels = new Array();
LogHoundLevels.getByText = function(text) {
    for(idx=0; idx<this.length; idx++) {
        if(this[idx].getText() == text) {
            return this[idx];
        }
    }
};
LogHoundLevels.getById = function(id) {
    for(idx=0; idx<this.length; idx++) {
        if(this[idx].getId() == id) {
            return this[idx];
        }
    }
};
LogHoundLevels.getLevel = function(level) {
    if((typeof level)=="number") {
        return this.getById(level);
    } else if((typeof level)=="string") {
        return this.getByText(level);
    } else if(!(level instanceof LogHoundLevel)) {
        return null;
    }
    return level;
};
LogHoundLevels.addLevel = function(newLevelFn) {
    FctsTools.extend(newLevelFn, LogHoundLevel);
    var newLevel = new newLevelFn();
    LogHoundLevels[newLevel.getText().toUpperCase()] = newLevel;
    LogHoundLevels.push(newLevel);
};

function LogHoundLevel(id, text, enabled) {
    this.id = id;
    this.text = text;
    this.enabled = enabled;
}
LogHoundLevel.prototype.getId = function() {
    return this.id;
};
LogHoundLevel.prototype.getText = function() {
    return this.text;
};
LogHoundLevel.prototype.isEnabled = function() {
    return this.enabled;
};
LogHoundLevel.prototype.setEnabled = function(enable) {
    this.enabled = enable;
};
// Fatal Log Level
function FatalLogHoundLevel() {
    FatalLogHoundLevel.baseConstructor.call(this, 100, 'fatal', true);
}
LogHoundLevels.addLevel(FatalLogHoundLevel);
// Error Log Level
function ErrorLogHoundLevel() {
    ErrorLogHoundLevel.baseConstructor.call(this, 90, 'error', true);
}
LogHoundLevels.addLevel(ErrorLogHoundLevel);
// Warn Log Level
function WarnLogHoundLevel() {
    WarnLogHoundLevel.baseConstructor.call(this, 80, 'warn', true);
}
LogHoundLevels.addLevel(WarnLogHoundLevel);
// Info Log Level
function InfoLogHoundLevel() {
    InfoLogHoundLevel.baseConstructor.call(this, 70, 'info', true);
}
LogHoundLevels.addLevel(InfoLogHoundLevel);
// Debug Log Level
function DebugLogHoundLevel() {
    DebugLogHoundLevel.baseConstructor.call(this, 60, 'debug', true);
}
LogHoundLevels.addLevel(DebugLogHoundLevel);
// Trace Log Level
function TraceLogHoundLevel() {
    TraceLogHoundLevel.baseConstructor.call(this, 50, 'trace', true);
}
LogHoundLevels.addLevel(TraceLogHoundLevel);

// Load predefined extra log levels
if(!(typeof(LogHoundLevelPreload)=='undefined') && (LogHoundLevelPreload instanceof Array)) {
    for(i=0; i<LogHoundLevelPreload.length; i++) {
        LogHoundLevels.addLevel(LogHoundLevelPreload[i]);
    }
}

/**
 * Main Log Hound object-function definition.
 */
function LogHound() {
    this.me = this;
    this.msgCount = 0;
    this.logLevel = LogHoundLevels['DEBUG'];
    this.killSwitch = false;
    this.enabled = true;
    this.initialised = false;
    this.helpEnabled = false;
    this.tagNameRegex = new RegExp('^[a-z][-a-z0-9_]+$','i');
}
LogHound.prototype.doSetup = function() {
    if(this.killSwitch) {
        return;
    }
    this.tagMode = 'A';
    this.msgDispMode = 'brief'; // detail, brief
    this.killSwitch = true;
    this.initialised = true;
    this.helpEntries = new Array();
    this.msgRecords = new Array();
    this.msgTags = new Array();
    this.msgFilters = new Array();
    this.msgFilters.push(new LogHoundMessageLevelFilter());
    var logPlate = document.createElement('DIV');
    logPlate.setAttribute('id', 'lhPlate');
    logPlate.setAttribute('class', 'lhRndCorners');
    this.logPlate = document.body.appendChild(logPlate);

    this.logPlateHead = document.createElement('DIV');
    this.logPlateHead.setAttribute('id', 'lhPlateHead');
    this.logPlateHead.setAttribute('class', 'lhPlateColor lhRndCorners');
    var titlebar = '<table width="100%" border="0" cellspacing="0" cellpadding="0"><tr>';
    titlebar +=    '<td><span id="lhBtnShade" class="lhBtnShade lhCtrl lhBtn" title="Toggle Message Panel">v</span></td>';
    titlebar +=    '<td class="lhTitle">Log Hound v'+LogHoundVer.getLongText()+'</td>'
    titlebar +=    '<td><span id="lhBtnHelp" class="lhBtnHelp lhCtrl lhBtn" title="Toggle Help Panel">?</span></td>';
    titlebar +=    '<td><span id="lhBtnTags" class="lhBtnTags lhCtrl lhBtn" title="Toggle Tags Panel">T</span></td>';
    titlebar +=    '<td><span id="lhBtnCtrls" class="lhBtnCtrls lhCtrl lhBtn" title="Toggle Control Panel">C</span></td>'
    titlebar +=    '</tr></table>';
    this.logPlateHead.innerHTML = titlebar;
    this.logPlate.appendChild(this.logPlateHead);

    // Help panel creation code.
    this.logPlateHelpPanel = document.createElement('DIV');
    this.logPlateHelpPanel.setAttribute('id', 'lhPlateHelpPanel');
    this.logPlateHelpPanel.setAttribute('class', 'lhPlateColor lhRndCorners');
    var helpBarInfo = 'Mouse over any interface element to see help for that element here.';
    this.logPlateHelpPanel.innerHTML = helpBarInfo;
    this.logPlateHelpPanel.lhDfltTxt = helpBarInfo;
    this.logPlateHelpPanel.lhPanelState = 'hide';
    this.logPlate.appendChild(this.logPlateHelpPanel);

    // Control panel creation code.
    this.logPlateCtrlPanel = document.createElement('DIV');
    this.logPlateCtrlPanel.setAttribute('id', 'lhPlateCtrlPanel');
    this.logPlateCtrlPanel.setAttribute('class', 'lhPlateColor lhRndCorners');
    var ctrlbar = '<table  cellspacing="0"><tr>';
    ctrlbar +=    '<td><span id="lhCtrlMore" class="lhCtrl lhBtn" title="Show More">v</span></td>';
    ctrlbar +=    '<td><span id="lhCtrlLess" class="lhCtrl lhBtn" title="Show Less">^</span></td>';
    ctrlbar +=    '<td><div id="lhCtrlLvlSelectPlate"><select id="lhLvlSelect" name="lhLvlSelect" class="lhFont"></select></div></td>';
    ctrlbar +=    '<td><div id="lhCtrlLvlPlate">';
    ctrlbar +=    '<span id="lhCtrlLvlFatal" class="lhFatalMsg lhCtrlLvl lhCtrl lhBtn" title="Fatal">+</span>';
    ctrlbar +=    '<span id="lhCtrlLvlError" class="lhErrorMsg lhCtrlLvl lhCtrl lhBtn" title="Error">+</span>';
    ctrlbar +=    '<span id="lhCtrlLvlWarn" class="lhWarnMsg lhCtrlLvl lhCtrl lhBtn" title="Warn">+</span>';
    ctrlbar +=    '<span id="lhCtrlLvlInfo" class="lhInfoMsg lhCtrlLvl lhCtrl lhBtn" title="Info">+</span>';
    ctrlbar +=    '<span id="lhCtrlLvlDebug" class="lhDebugMsg lhCtrlLvl lhCtrl lhBtn" title="Debug">+</span>';
    ctrlbar +=    '<span id="lhCtrlLvlTrace" class="lhTraceMsg lhCtrlLvl lhCtrl lhBtn" title="Trace">+</span>';
    ctrlbar +=    '</div></td>';
    ctrlbar +=    '<td><div id="lhCtrlMsgDispModeBtn" class="lhDispModeLable lhCtrl lhBtn lhFont" title="Toggle message display mode">D</div></td>';
    ctrlbar +=    '<td><div id="lhCtrlSearchPlate">';
    ctrlbar +=    '<label for="lhSearchField" class="lhFont lhSearchLabel lhCtrl">Search:</label>';
    ctrlbar +=    '<input type="text" id="lhSearchField" name="lhSearchField" class="lhSearchField" onkeyup="window.logHound.search()"/>';
    ctrlbar +=    '</div></td>';
    ctrlbar +=    '</tr></table>';
    this.logPlateCtrlPanel.innerHTML = ctrlbar;
    this.logPlateCtrlPanel.lhPanelState = 'hide';
    this.logPlate.appendChild(this.logPlateCtrlPanel);
    this.addHelpEntry(['lhCtrlMore','Show more messages: Lengthens the log message pane to show more messages.']);
    this.addHelpEntry(['lhCtrlLess','Show less messages: Shortens the log message pane to show fewer messages.']);
    this.addHelpEntry(['lhSearchField','Search text entry: Message text is matched as you type, with non-matching log messages being automatically hidden.']);
    this.addHelpEntry(['lhCtrlLvlPlate','Log level visibility controls: Controls which log level messages will be visible in the message pane.']);
    this.addHelpEntry(['lhCtrlMsgDispModeBtn','Message detail toggle: Toggles the message pane between normal message display and detailed message display.']);

    // Tag panel creation code
    this.logPlateTagPanel = document.createElement('DIV');
    this.logPlateTagPanel.setAttribute('id', 'lhPlateTagPanel');
    this.logPlateTagPanel.setAttribute('class', 'lhPlateColor lhRndCorners');
    var tagbar = '';
    tagbar +=    '<div class="lhShrinkWrap">';
    tagbar +=    '<div id="lhAvailTagsPlate">';
    tagbar +=    '<span class="lhFont">Tags:</span>';
    tagbar +=    '<div><select id="lhAvailTagsSelect" class="lhInput lhFont" multiple="multiple" size="4"></select></div>';
    tagbar +=    '</div>';

    tagbar +=    '<div id="lhCtrlTagsPlate">';
    tagbar +=    '<span id="lhTagCtrlAddBtn" class="lhTagCtrl lhBtn lhFont" title="Add Selected">&gt;</span>';
    tagbar +=    '<span id="lhTagCtrlAddAllBtn" class="lhTagCtrl lhBtn lhFont" title="Add All">&gt;&gt;</span>';
    tagbar +=    '<span id="lhTagCtrlRemBtn" class="lhTagCtrl lhBtn lhFont" title="Remove Selected">&lt;</span>';
    tagbar +=    '<span id="lhTagCtrlRemAllBtn" class="lhTagCtrl lhBtn lhFont" title="Remove All">&lt;&lt;</span>';
    tagbar +=    '</div>';

    // http://www.dhtmlgoodies.com/scripts/multiple_select/multiple_select.html
    tagbar +=    '<div id="lhViewTagsPlate">';
    tagbar +=    '<span class="lhFont">Viewing:</span>';
    tagbar +=    '<div><select id="lhViewTagsSelect" class="lhInput" multiple="multiple" size="4"></select></div>';
    tagbar +=    '</div>';

    tagbar +=    '<div id="lhModTagsPlate">';
    tagbar +=    '<span id="lhTagCtrlAnyBtn" class="lhTagCtrl lhFont lhBtn" title="Any">A</span>';
    tagbar +=    '<span id="lhTagCtrlIntBtn" class="lhTagCtrl lhFont lhBtn" title="Intersection">I</span>';
    tagbar +=    '<span id="lhTagCtrlOnyBtn" class="lhTagCtrl lhFont lhBtn" title="Only">O</span>';
    tagbar +=    '<span id="lhTagCtrlExcBtn" class="lhTagCtrl lhFont lhBtn" title="Exclusion">E</span>';
    tagbar +=    '</div>';
    tagbar +=    '</div>';
    this.logPlateTagPanel.innerHTML = tagbar;
    this.logPlateTagPanel.lhPanelState = 'hide';
    this.logPlate.appendChild(this.logPlateTagPanel);
    this.addHelpEntry(['lhAvailTagsSelect','Available Tags Select: Lists all unique available tags assigned to any messages.']);
    this.addHelpEntry(['lhViewTagsSelect','View Tags Select: Tags listed here will affect what messages are visible, depending on the active tag modifier.']);
    this.addHelpEntry(['lhTagCtrlAddBtn','Add Selected Tags: Moves tags selected in the available tags box to the viewing box.']);
    this.addHelpEntry(['lhTagCtrlAddAllBtn','Add All Tags: Moves all tags in the available tags box to the viewing box.']);
    this.addHelpEntry(['lhTagCtrlRemBtn','Remove Selected Tags: Moves tags selected in the viewing tags box to the available tags box.']);
    this.addHelpEntry(['lhTagCtrlRemAllBtn','Remove All Tags: Moves all tags in the viewing tags box back to the available tags box.']);


    this.logPlateBodyBox = document.createElement('DIV');
    this.logPlateBodyBox.setAttribute('id', 'lhPlateBodyBox');
    this.logPlateBodyBox.setAttribute('class', 'lhPlateColor lhRndCorners');
    this.logPlateBodyBox.style.display = 'none';
    this.logPlate.appendChild(this.logPlateBodyBox);

    this.logPlateBody = document.createElement('DIV');
    this.logPlateBody.setAttribute('id', 'lhPlateBody');
    this.logPlateBodyBox.appendChild(this.logPlateBody);

    // Add levels to level select control.
    var lvlSelect = document.getElementById('lhLvlSelect');
    var level;
    for(idx = 0; idx<LogHoundLevels.length; idx++) {
        level = LogHoundLevels[idx];
        lvlSelect.options[lvlSelect.length] = new Option(level.getText(),level.getId());
    }
    FctsTools.sortOptionsByValue(lvlSelect,function(o1,o2) {
        return parseInt(o2)-parseInt(o1);
    });
    document.getElementById('lhLvlSelect').onchange = function(event) {
        window.logHound.setLogLevel(parseInt(this.value));
    }
    this.addHelpEntry(['lhLvlSelect','Level Select: Levels are in descending order. Only messages corresponding to the level shown and those above will be logged after change.']);

    var btns = document.getElementsByClassName('lhBtn');
    for(idxBtns in btns) {
        document.addStyleClass(btns[idxBtns],'lhBtnOut');
    }
    for(btnIdx in btns) {
        btns[btnIdx].onmouseover = function(event) {
            document.removeStyleClass(this, 'lhBtnOut');
            document.removeStyleClass(this, 'lhBtnOn');
            document.addStyleClass(this, 'lhBtnOver');
        }
        btns[btnIdx].onmouseout = function(event) {
            document.removeStyleClass(this, 'lhBtnOver');
            if(this.lhBtnState=='on') {
                document.addStyleClass(this, 'lhBtnOn');
            } else {
                document.replaceStyleClass(this, 'lhBtnOn', 'lhBtnOut');
            }
        }
        btns[btnIdx].lhBtnState = 'off';
    }
    document.getElementById('lhTagCtrlAddBtn').onclick = function(event) {
        window.logHound.moveTagAssignments('add');
    };
    document.getElementById('lhTagCtrlRemBtn').onclick = function(event) {
        window.logHound.moveTagAssignments('rem');
    };
    document.getElementById('lhTagCtrlRemAllBtn').onclick = function(event) {
        window.logHound.moveTagAssignments('remAll');
    };
    document.getElementById('lhTagCtrlAddAllBtn').onclick = function(event) {
        window.logHound.moveTagAssignments('addAll');
    };
    document.getElementById('lhCtrlMore').onclick = function(event) {
        window.logHound.showMoreMessages();
    };
    document.getElementById('lhCtrlLess').onclick = function(event) {
        window.logHound.showLessMessages();
    };
    var levelControls = document.getElementsByClassName('lhCtrlLvl');
    for(idx=0; idx<levelControls.length; idx++) {
        levelControls[idx].onclick = function(event) {
            window.logHound.toggleMsgLvl(this);
        }
    }
    document.getElementById('lhBtnShade').onclick = function(event) {
        window.logHound.toggleDisplay();
    };
    this.addHelpEntry(['lhBtnShade','Shade Mode Toggle: Toggles the Log Hound interface between shade display mode and normal display mode.']);
    // Help panel setup
    document.getElementById('lhBtnHelp').onclick = function(event) {
        window.logHound.toggleHelpPanel('toggle');
    };
    this.addHelpEntry(['lhBtnHelp','Help Panel Toggle: Opens and closes the help panel.']);

    // Message panel setup
    var toggleCtrl = document.getElementById('lhBtnCtrls');
    toggleCtrl.onclick = function(event) {
        window.logHound.toggleCtrlPanel('toggle');
    };
    this.addHelpEntry(['lhBtnCtrls','Control Panel Toggle: Opens and closes the control panel.']);


    // Tag panel setup
    document.getElementById('lhBtnTags').onclick = function(event) {
        window.logHound.toggleTagCtrlPanel('toggle');
    };
    this.addHelpEntry(['lhBtnTags','Tag Panel Toggle: Opens and closes the tag control panel.']);
    document.getElementById('lhTagCtrlAnyBtn').onclick = function(event) {
        window.logHound.setTagFilterMode('A');
        window.logHound.activateTagMode(document.getElementById('lhTagCtrlAnyBtn'));
    };
    this.addHelpEntry(['lhTagCtrlAnyBtn','"Any" Tags Modifier: Messages with any of the viewing tags will be visible.']);
    document.getElementById('lhTagCtrlIntBtn').onclick = function(event) {
        window.logHound.setTagFilterMode('I');
        window.logHound.activateTagMode(document.getElementById('lhTagCtrlIntBtn'));
    };
    this.addHelpEntry(['lhTagCtrlIntBtn','"Intersection" Tags Modifier: Only messages that have all of the viewing tags will be visible.']);
    document.getElementById('lhTagCtrlOnyBtn').onclick = function(event) {
        window.logHound.setTagFilterMode('O');
        window.logHound.activateTagMode(document.getElementById('lhTagCtrlOnyBtn'));
    };
    this.addHelpEntry(['lhTagCtrlOnyBtn','"Only" Tags Modifier: Only messages that have all of the viewing tags and no other tags will be visible.']);
    document.getElementById('lhTagCtrlExcBtn').onclick = function(event) {
        window.logHound.setTagFilterMode('E');
        window.logHound.activateTagMode(document.getElementById('lhTagCtrlExcBtn'));
    };
    this.addHelpEntry(['lhTagCtrlExcBtn','"Exclusion" Tags Modifier: Only messages that have none of the viewing tags will be visible.']);


    document.getElementById('lhCtrlMsgDispModeBtn').onclick = function(event) {
        window.logHound.toggleMsgLayout();
    };

    this.searchField = document.getElementById('lhSearchField');

    this.adjustPlateSize();
    this.startInterfaceMonitor();
    setTimeout('window[\'logHound\'].show(true)',800);
    this.logInfo('Log Hound is online...');
    var msg = 'document.body.clientWidth='+document.body.clientWidth+'<br/>document.documentElement.clientWidth='+document.documentElement.clientWidth+'<br/>window.innerWidth='+window.innerWidth+'<br/>document.body.scrollWidth='+document.body.scrollWidth+'<br/>document.body.offsetWidth='+document.body.offsetWidth;
    //this.logInfo(msg);
};
LogHound.prototype.activateTagMode = function(btn) {
    var excBtn = document.getElementById('lhTagCtrlExcBtn');
    var anyBtn = document.getElementById('lhTagCtrlAnyBtn');
    var onyBtn = document.getElementById('lhTagCtrlOnyBtn');
    var intBtn = document.getElementById('lhTagCtrlIntBtn');
    excBtn.lhBtnState = 'off';
    document.removeStyleClass(excBtn, 'lhBtnOn');
    anyBtn.lhBtnState = 'off';
    document.removeStyleClass(anyBtn, 'lhBtnOn');
    onyBtn.lhBtnState = 'off';
    document.removeStyleClass(onyBtn, 'lhBtnOn');
    intBtn.lhBtnState = 'off';
    document.removeStyleClass(intBtn, 'lhBtnOn');

    btn.lhBtnState = 'on';
    document.addStyleClass(btn, 'lhBtnOn');
};
LogHound.prototype.addHelpEntry = function(entry) {
    this.helpEntries[this.helpEntries.length] = entry;
};
LogHound.prototype.toggleHelp = function(enable) {
    if(enable!=null && enable) {
        if(this.helpEnabled) { return; }
        this.helpEnabled = true;
        var target = null;
        for(i=0; i<this.helpEntries.length; i++) {
            target = document.getElementById(this.helpEntries[i][0]);
            target.lhHelpTxt = this.helpEntries[i][1];
            target.lhOrigMouseOver = target.onmouseover;
            target.lhOrigMouseOut = target.onmouseout;
            target.onmouseover = function() {
                var whatthehell = this.lhOrigMouseOver;
                if(!(typeof(this.lhOrigMouseOver)=='undefined') && this.lhOrigMouseOver!=null) { this.lhOrigMouseOver(); }
                document.getElementById('lhPlateHelpPanel').innerHTML = this.lhHelpTxt;
            };
            target.onmouseout = function() {
                if(!(typeof(this.lhOrigMouseOut)=='undefined') && this.lhOrigMouseOut!=null) { this.lhOrigMouseOut(); }
                document.getElementById('lhPlateHelpPanel').innerHTML = document.getElementById('lhPlateHelpPanel').lhDfltTxt;
            }
        }
    } else {
        if(!this.helpEnabled) { return; }
        this.helpEnabled = false;
        var target = null;
        for(i=0; i<this.helpEntries.length; i++) {
            target = document.getElementById(this.helpEntries[i][0]);
            target.lhHelpTxt = this.helpEntries[i][1];
            target.onmouseover = target.lhOrigMouseOver;
            target.onmouseout = target.lhOrigMouseOut;
        }
    }
};
LogHound.prototype.toggleMsgLayout = function() {
    this.msgDispMode= (this.msgDispMode=='brief' ? 'detail' : 'brief');
    var briefMsgRecs = document.getElementsByClassName('lhMsgRecBrief');
    for(idx=0; idx<briefMsgRecs.length; idx++) {
        briefMsgRecs[idx].style.display = (this.msgDispMode=='brief' ? 'block' : 'none');
    }
    var detailMsgRecs = document.getElementsByClassName('lhMsgRecDetail');
    for(idx=0; idx<detailMsgRecs.length; idx++) {
        detailMsgRecs[idx].style.display = (this.msgDispMode=='brief' ? 'none' : 'block');
    }
};
LogHound.prototype.setTagFilterMode = function(mode) {
    this.tagMode = ((mode!='A' && mode!='I' && mode!='E' && mode!='O') ? 'A' : mode);
    var viewSelect = document.getElementById('lhViewTagsSelect');
    this.addMsgFilter(new LogHoundMessageTagFilter(FctsTools.getOptionValues(viewSelect),this.tagMode));
    this.applyMsgFilters();
};
LogHound.prototype.setKillSwitch = function(killSwitch) {
    if(killSwitch!=null && killSwitch==false) {
        this.killSwitch = false;
    } else {
        this.killSwitch = true;
    }
};
/*
 * Enable or disable logging. When set to false, logging is completely disabled,
 * which means no messages are processed or stored and Log Hound is basically
 * turned "off".
 * @param enable Set to "true" to enable logging, otherwise "false"
 */
LogHound.prototype.enableLogging = function(enable) {
    if(enable!=null && enable==false) {
        this.enabled = false;
    } else {
        this.enabled = true;
    }
};
LogHound.prototype.show = function(show) {
    // If the kill switch is enabled, do absolutely nothing.
    if(!this.initialised || !this.enabled) {
        return;
    }
    if(show!=null && show==true) {
        this.logPlate.style.display = 'block';
        this.adjustPlateSize();
    } else {
        this.logPlate.style.display = 'none';
    }
};
/**
 *
 * @return The loglevel object
 */
LogHound.prototype.getLogLevel = function() {
    return this.logLevel;
};
LogHound.prototype.setLogLevel = function(level) {
    level = LogHoundLevels.getLevel(level);
    if(level==null) { return; }
    this.logLevel = level;
    var lvlSelect = document.getElementById('lhLvlSelect');
    if(level.getId()!=lvlSelect.options[lvlSelect.selectedIndex].value) {
        for(var i=0; i<lvlSelect.options.length; i++) {
            if(level.getId()==lvlSelect.options[i].value) {
                lvlSelect.selectedIndex = i;
            }
        }
    }
};
LogHound.prototype.startInterfaceMonitor = function() {
    this.debugWindowMonitorRef = setInterval('window.logHound.stickLogPlateTopRight()', 500);
};
LogHound.prototype.getLogLevelObject = function(name) {
    if(name==null) {
        return null;
    }
    name = name.toLowerCase();
    for(idx=0; idx<LogHoundLevels.length; idx++) {
        if(LogHoundLevels[idx].getText()==name) {
            return LogHoundLevels[idx];
        }
    }
};
LogHound.prototype.toggleMsgLvl = function(btn) {
    var logLevelName = btn.id.slice(9);
    var logLevel = this.getLogLevelObject(logLevelName);
    if(btn.innerHTML=='+') {
        btn.innerHTML = '&ndash;';
        logLevel.setEnabled(false);
    } else {
        btn.innerHTML = '+';
        logLevel.setEnabled(true);
    }
    this.applyMsgFilters();
};
/**
 * Adds a filter to the message filter array.
 * Filter object must implement two methods:
 * filter.getId() - returns an ID for the filter.
 * filter.showMessage(messageRecord) - Takes the message row record object and returns either 'true'
 * if the message should be visible, or 'false' if the message should be hidden.
 * @param filter The message filter to add to the internal array.
 */
LogHound.prototype.addMsgFilter = function(newFilter) {
    if(!newFilter.getId || !(newFilter instanceof LogHoundMessageFilter)) {
        alert('Argumented object is not a LogHoundMessageFilter.');
        return;
    }
    if(!newFilter.showMessage || typeof newFilter.showMessage !='function') {
        alert('Filter.showMessage is not a function.');
        return;
    }
    var newFilterArray = new Array();
    var msgFilter = null;
    for(idx in this.msgFilters) {
        msgFilter = this.msgFilters[idx];
        if(msgFilter.getId()!=newFilter.getId()) {
            newFilterArray.push(msgFilter);
        }
    }
    this.msgFilters = newFilterArray;
    this.msgFilters.push(newFilter);
};
/**
 * Applies all the currently active message filters to the displayed message rows.
 */
LogHound.prototype.applyMsgFilters = function() {
    var ts = (new Date()).getTime();
    var index = 0;
    var targetMsgRow = null;
    var showMsg = true;
    for(recIdx=0; recIdx<this.msgRecords.length; recIdx++) {
        this.msgRecords[recIdx]['element'].style.display = (this.filterMsg(this.msgRecords[recIdx]) ? 'block' : 'none');
    }
    //this.logTrace('Message filters applied in '+((new Date()).getTime()-ts)+'ms',['LogHound','applyMsgFilters()']);
};
/**
 *
 */
LogHound.prototype.filterMsg = function(msgRec) {
    for(idx=0; idx<this.msgFilters.length; idx++) {
        if(!this.msgFilters[idx].showMessage(msgRec)) {
            return false;
        }
    }
    return true;
};
LogHound.prototype.toggleDisplay = function(show) {
    var toggleBtn = document.getElementById('lhBtnShade');
    show = (show==null ? this.logPlateBodyBox.style.display == 'none' : show);
    if(show) {
        this.logPlateBodyBox.style.display = 'block';
        this.toggleTagCtrlPanel('restore');
        this.toggleHelpPanel('restore');
        this.toggleCtrlPanel('restore');
        this.adjustPlateSize();
        toggleBtn.innerHTML = '^';
    } else {
        this.logPlateBodyBox.style.display = 'none';
        this.logPlateHelpPanel.style.display = 'none';
        this.logPlateTagPanel.style.display = 'none';
        this.logPlateCtrlPanel.style.display = 'none';
        this.logPlate.style.height = this.logPlateHead.offsetHeight;
        toggleBtn.innerHTML = 'v';
    }
};
/*
 * @param cmd Can be one of four strings: display, hide, toggle, or restore.
 * display:  Displays the panel.
 * hide:     Hides the panel.
 * toggle:   Toggles the panel from the saved state.
 * restore:  Restores the panel to the saved state.
 */
LogHound.prototype.toggleHelpPanel = function(cmd) {
    if(cmd=='restore') {
        cmd = this.logPlateHelpPanel.lhPanelState;
    } else if(cmd=='toggle') {
        cmd = (this.logPlateHelpPanel.lhPanelState=='hide' ? 'display' : 'hide');
    }
    if(cmd=='display') {
        this.logPlateHelpPanel.innerHTML = this.logPlateHelpPanel.lhDfltTxt;
        this.logPlateHelpPanel.style.display = 'block';
        this.logPlateHelpPanel.lhPanelState = 'display';
        this.toggleHelp(true);
    } else {
        this.logPlateHelpPanel.style.display = 'none';
        this.logPlateHelpPanel.lhPanelState = 'hide';
        this.toggleHelp(false);
    }
    this.adjustPlateSize();
};
/*
 * @param cmd Can be one of four strings: display, hide, toggle, or restore.
 * display:  Displays the panel.
 * hide:     Hides the panel.
 * toggle:   Toggles the panel from the saved state.
 * restore:  Restores the panel to the saved state.
 */
LogHound.prototype.toggleCtrlPanel = function(cmd) {
    if(cmd=='restore') {
        cmd = this.logPlateCtrlPanel.lhPanelState;
    } else if(cmd=='toggle') {
        cmd = (this.logPlateCtrlPanel.lhPanelState=='hide' ? 'display' : 'hide');
    }
    if(cmd=='display') {
        this.logPlateCtrlPanel.style.display = 'block';
        this.logPlateCtrlPanel.lhPanelState = 'display';
    } else {
        this.logPlateCtrlPanel.style.display = 'none';
        this.logPlateCtrlPanel.lhPanelState = 'hide';
    }
    this.adjustPlateSize();
};
/*
 * @param cmd Can be one of four strings: display, hide, toggle, or restore.
 * display:  Displays the panel.
 * hide:     Hides the panel.
 * toggle:   Toggles the panel from the saved state.
 * restore:  Restores the panel to the saved state.
 */
LogHound.prototype.toggleTagCtrlPanel = function(cmd) {
    if(cmd=='restore') {
        cmd = this.logPlateTagPanel.lhPanelState;
    } else if(cmd=='toggle') {
        cmd = (this.logPlateTagPanel.lhPanelState=='hide' ? 'display' : 'hide');
    }
    if(cmd=='display') {
        this.logPlateTagPanel.style.display = 'block';
        this.logPlateTagPanel.lhPanelState = 'display';
    } else {
        this.logPlateTagPanel.style.display = 'none';
        this.logPlateTagPanel.lhPanelState = 'hide';
    }
    this.adjustPlateSize();
};
LogHound.prototype.showMoreMessages = function() {
    this.toggleDisplay(true);
    var boxHeight = this.logPlateBodyBox.offsetHeight;
    if(boxHeight>600) {
        return;
    }
    this.logPlateBodyBox.style.height = boxHeight+50;
    this.adjustPlateSize();
};
LogHound.prototype.showLessMessages = function() {
    var boxHeight = this.logPlateBodyBox.offsetHeight;
    if(boxHeight<50) {
        return;
    }
    this.logPlateBodyBox.style.height = boxHeight-50;
    this.adjustPlateSize();
};
LogHound.prototype.adjustPlateSize = function() {
    this.logPlate.offsetHeight
    var totalHeight = this.logPlateHead.offsetHeight;
    totalHeight += this.logPlateHelpPanel.offsetHeight;
    totalHeight += this.logPlateCtrlPanel.offsetHeight;
    totalHeight += this.logPlateTagPanel.offsetHeight;
    totalHeight += this.logPlateBodyBox.offsetHeight;
    this.logPlate.style.height = totalHeight;
};
LogHound.prototype.stickLogPlateTopLeft = function() {
    var scrollHeight = $(window).scrollTop();
    this.logPlate.style.left=0;
    this.logPlate.style.top=(0+scrollHeight);
    this.logPlate.style.zIndex=500;
};
LogHound.prototype.stickLogPlateTopRight = function() {
    var plateHeight = this.logPlate.offsetHeight;
    var plateWidth = this.logPlate.offsetWidth;
    var winHeight = FctsTools.windowHeight();
    var winWidth = FctsTools.windowWidth();
    var scrollTop = FctsTools.scrollTop();
    var scrollLeft = FctsTools.scrollLeft();
    /*
    var winHeight = $(window).height();
    var winWidth = $(window).width();
    var scrollTop = $(window).scrollTop();
    var scrollLeft = $(window).scrollLeft();
    */
    this.logPlate.style.left=(FctsTools.viewWidth()-plateWidth+scrollLeft);
    this.logPlate.style.top=(scrollTop);
    this.logPlate.style.zIndex=500;
};
LogHound.prototype.stickLogPlateBottomLeft = function() {
    var plateHeight = this.logPlate.offsetHeight;
    var winHeight = FctsTools.windowHeight();
    var scrollTop = FctsTools.scrollTop();
    this.logPlate.style.left=0;
    this.logPlate.style.top=(winHeight-plateHeight+scrollTop);
    this.logPlate.style.zIndex=500;
};
LogHound.prototype.search = function(textToMatch) {
    if(!textToMatch || textToMatch==null || textToMatch=='') {
        textToMatch = this.searchField.value;
    }
    if(!textToMatch || textToMatch==null) {
        textToMatch = '';
    }
    textToMatch = this.escapeRegex(textToMatch);

    var searchFilter = new LogHoundTextSearchFilter(textToMatch);
    this.addMsgFilter(searchFilter);
    this.applyMsgFilters();
};
LogHound.prototype.escapeRegex = function(targetText) {
    if(!arguments.callee.sRE) {
        var specials = [
            '/', '.', '*', '+', '?', '|',
            '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
            '(\\' + specials.join('|\\') + ')', 'g'
        );
    }
    return targetText.replace(arguments.callee.sRE, '\\$1');
};
/**
 * @return true if all the argumented tags were accepted, otherwise false.
 */
LogHound.prototype.addTags = function(tagz) {
    if(tagz==null || !tagz.length || tagz.length<1) {
        return true;
    }
    for(var i=0;i<tagz.length; i++) {
        if(!(this.tagNameRegex.test(tagz[i]))) {
            return false;
        }
    }
    var tagsSelect = document.getElementById('lhAvailTagsSelect');
    foundMatch:
    for(var i=0;i<tagz.length; i++) {
        for(allIdx in this.msgTags) {
            var t1 = tagz[i].toLowerCase();
            var t2 = this.msgTags[allIdx].toLowerCase();
            if(tagz[i].toLowerCase()==this.msgTags[allIdx].toLowerCase()) {
               continue foundMatch;
            }
        }
        if(tagz[i]==null || tagz[i]=='') { continue; }
        this.msgTags.push(tagz[i]);
        tagsSelect.options[tagsSelect.length] = new Option(tagz[i], tagz[i]);
    }
    FctsTools.sortOptionsByText(tagsSelect);
    return true;
};
/*
 * {'level':LogHoundLevels['TRACE'],'text':'This is message text','error':e,'tags':['tag1','tag2']}
 *
 */
LogHound.prototype.logTrace = function() { this.log(LogHoundLevels['TRACE'],arguments); };
LogHound.prototype.logDebug = function() { this.log(LogHoundLevels['DEBUG'],arguments); };
LogHound.prototype.logInfo = function() { this.log(LogHoundLevels['INFO'],arguments); };
LogHound.prototype.logWarn = function() { this.log(LogHoundLevels['WARN'],arguments); };
LogHound.prototype.logError = function() { this.log(LogHoundLevels['ERROR'],arguments); };
LogHound.prototype.logFatal = function() { this.log(LogHoundLevels['FATAL'],arguments); };
LogHound.prototype.parseLogData = function() {
    var argArray = new Array();
    for(var i=0; i<arguments.length; i++) {
        argArray[i] = arguments[i];
    }
    var msgRec = new Array();
    for(var i=0; i<argArray.length; i++) {
        if(argArray[i]==null) { continue; }
        if((typeof argArray[i])=='object' && !(argArray[i] instanceof Array) && argArray[i].length) {
            for(var j=0; j<argArray[i].length; j++) {
                argArray[argArray.length] = argArray[i][j];
            }
        } else if(argArray[i] instanceof Array) {
            msgRec['tags'] = argArray[i];
        } else if(argArray[i] instanceof LogHoundLevel) {
            msgRec['level'] = argArray[i];
        } else if(argArray[i] instanceof String || (typeof argArray[i])==='string') {
            msgRec['text'] = argArray[i];
        } else if(argArray[i] instanceof Error) {
            msgRec['error'] = argArray[i];
        }
    }
    return msgRec;
};
/**
 * Main logging function - this is where all log messages go to die... or be displayed.
 * @param level The log level of the message.
 * @param message The log message.
 */
LogHound.prototype.log = function() {
    // If the kill switch is enabled, throw away messages and do absolutely nothing.
    if(!this.initialised || !this.enabled) {
        return false;
    }
    var msgRec = this.parseLogData(arguments);
    msgRec['tags'] = (msgRec['tags']==null ? {} : msgRec['tags']);
    msgRec['timestamp'] = new Date();

    // Since the ESP code is not finished, we cannot do anything without a log level.
    if(msgRec['level']==null || this.logLevel.getId()>msgRec['level'].getId()) {
        return false;
    }
    if(FctsTools.isBlank(msgRec['text'])) {
        return false;
    }
    // add all unique tags to master active tag list
    if(!this.addTags(msgRec['tags'])) {
        return false;
    }
    msgRec['number'] = this.msgCount;
    this.msgRecords.push(msgRec);
    this.msgCount++;

    // Add message to display
    var msgElmt = document.createElement('DIV');
    var levelText = msgRec['level'].getText().charAt(0).toUpperCase() + msgRec['level'].getText().slice(1);
    var msgId = 'logmsg'+msgRec['number'];
    msgElmt.setAttribute('id', msgId);
    msgElmt.setAttribute('class','lh'+levelText+'Msg logMsg');
    msgElmt.setAttribute('className','lh'+levelText+'Msg logMsg');
    msgElmt.setAttribute('lhLogLevel', msgRec['level'].getText());
    msgElmt.style.display = (msgRec['level'].isEnabled()==true ? 'block' : 'none');

    var msgText = msgRec['text'];
    if(msgRec['error']!=null) {
        msgText += '<br/><hr/>';
        msgText += 'Error: '+msgRec['error'].name+' at line '+msgRec['error'].lineNumber+'<br/>';
        msgText += 'Message: '+msgRec['error'].message+'<br/>';
        if(msgRec['error'].stack!=null) {
            msgText += 'Stack:<br/>'+msgRec['error'].stack.replace('\n','<br/>');
        }
    }

    var msgFullEntryDisp = ((this.msgDispMode=='detail') ? 'block' : 'none');
    var msgFullEntry = '<table cellspacing="0" class="lhMsgRecDetail" style="display:'+msgFullEntryDisp+'"><tr>';
    msgFullEntry +=    '<td class="lhMsgNum lhMsgElmt lhFont">'+msgRec['number']+'</td>';
    msgFullEntry +=    '<td class="lhMsgLvl lhMsgElmt lhFont">'+msgRec['level'].getText()+'</td>';
    msgFullEntry +=    '<td class="lhMsgTime lhMsgElmt lhFont">'+this.getTimestampText(msgRec['timestamp'])+'</td>';
    msgFullEntry +=    '<td class="lhMsgTxt lhMsgElmt lhFont">'+((msgRec['tags'] instanceof Array) ? msgRec['tags'] : '')+'</td>';
    msgFullEntry +=    '</tr><tr>';
    msgFullEntry +=    '<td colspan="4" class="lhMsgTxtFull lhMsgElmt lhFont">'+msgText+'</td>';
    msgFullEntry +=    '</tr></table>';

    var msgEntryDisp = ((this.msgDispMode=='brief') ? 'block' : 'none');
    var msgEntry = '<table cellspacing="0" class="lhMsgRecBrief" style="display:'+msgEntryDisp+'"><tr>';
    msgEntry +=    '<td class="lhMsgNum lhMsgElmt lhFont">'+msgRec['number']+'</td>';
    msgEntry +=    '<td class="lhMsgTime lhMsgElmt lhFont">'+this.getTimestampText(msgRec['timestamp'])+'</td>';
    msgEntry +=    '<td class="lhMsgTxt lhMsgElmt lhFont">'+msgText+'</td>';
    msgEntry +=    '</tr></table>';

    msgElmt.innerHTML=msgFullEntry+msgEntry;
    var children = this.logPlateBody.childNodes;
    if(children==null || children.length<1) {
        this.logPlateBody.appendChild(msgElmt);
    } else {
        this.logPlateBody.insertBefore(msgElmt,children[0]);
    }
    // Add message DOM element to record.
    msgRec['element'] = document.getElementById(msgId);
    return true;
};
LogHound.prototype.getTimestampText = function(ts) {
    var hour = ts.getHours();
    var minute = ts.getMinutes();
    var second = ts.getSeconds();
    var millis = ts.getMilliseconds();
    var tsTxt = ((hour<10) ? '0'+hour : hour)+':';
    tsTxt += ((minute<10) ? '0'+minute : minute)+':';
    tsTxt += ((second<10) ? '0'+second : second)+'.';
    tsTxt += ((millis<10) ? '00'+millis : ((millis<100) ? '0'+millis : millis));
    return tsTxt;
};
/**
 * @param action Can be one of four values:
 * <ul>
 *     <li>'add' adds any selected tags from the available list to the "view" list.</li>
 *     <li>'addAll' adds all tags from the available list to the "view" list.</li>
 *     <li>'rem' removes any selected tags from the view list.</li>
 *     <li>'remAll' removes all tags from the view list.</li>
 * </ul>
 */
LogHound.prototype.moveTagAssignments = function(action) {
    var availSelect = document.getElementById('lhAvailTagsSelect');
    var viewSelect = document.getElementById('lhViewTagsSelect');
    if(action == 'add') {
        if(availSelect.options.length<1 || availSelect.selectedIndex<0) { return; }
        FctsTools.moveSelected(availSelect, viewSelect);
    } else if(action == 'addAll') {
        if(availSelect.options.length<1) { return; }
        FctsTools.moveAllOptions(availSelect, viewSelect);
    } else if(action == 'rem') {
        if(viewSelect.options.length<1 || viewSelect.selectedIndex<0) { return; }
        FctsTools.moveSelected(viewSelect, availSelect);
    } else if(action == 'remAll') {
        if(viewSelect.options.length<1) { return; }
        FctsTools.moveAllOptions(viewSelect, availSelect);
    }
    FctsTools.sortOptionsByText(availSelect);
    FctsTools.sortOptionsByText(viewSelect);
    this.addMsgFilter(new LogHoundMessageTagFilter(FctsTools.getOptionValues(viewSelect),this.tagMode));
    this.applyMsgFilters();
};
LogHound.prototype.getViewTags = function() {
    var viewSelect = document.getElementById('lhViewTagsSelect');
    return FctsTools.getOptionValues(viewSelect);
};
LogHound.prototype.getAvailTags = function() {
    var availSelect = document.getElementById('lhAvailTagsSelect');
    return FctsTools.getOptionValues(viewSelect);
};
function LogHoundMessageFilter(id) {
    this.id = id;
}
LogHoundMessageFilter.prototype.getId = function() {
    return this.id;
};
LogHoundMessageFilter.prototype.showMessage = function(msgRec) {
    return true;
};
/**
 *
 */
function LogHoundMessageTagFilter(tagArray, tagMode) {
    LogHoundMessageTagFilter.baseConstructor.call(this, 'lhMsgTagFilter');
    this.tagz = tagArray;
    this.tagMode = ((tagMode==null || tagMode=='') ? 'A' : tagMode);
}
FctsTools.extend(LogHoundMessageTagFilter, LogHoundMessageFilter);
LogHoundMessageTagFilter.prototype.showMessage = function(msgRec) {
    if(this.tagz==null || this.tagz.length<1) {
        return true;
    }
    if(this.tagMode=='I') {
        if(!(msgRec['tags'] instanceof Array)) { return false; }
        if(msgRec['tags'].length<this.tagz.length) { return false; }
    }
    if(this.tagMode=='O') {
        if(msgRec['tags'].length!=this.tagz.length) { return false; }
    }
    var matched = false;
    var intMatched = false;
    for(targetIdx=0; targetIdx<this.tagz.length; targetIdx++) {
        intMatched = false;
        for(tagIdx=0; tagIdx<msgRec['tags'].length; tagIdx++) {
            matched = (msgRec['tags'][tagIdx].toLowerCase() == this.tagz[targetIdx].toLowerCase());
            if(this.tagMode=='I' || this.tagMode=='O') {
                intMatched = (intMatched || matched);
            } else if(matched && this.tagMode=='A') {
                return true;
            } else if(matched && this.tagMode=='E') {
                return false;
            }
        }
        if((this.tagMode=='I' || this.tagMode=='O') && !intMatched) { return false; }
    }
    return (this.tagMode=='E' || this.tagMode=='I' || this.tagMode=='O');
};
LogHoundMessageTagFilter.prototype.hasTag = function(tag,msgTags) {
    for(i=0; i<msgTags.length; i++) {
        if(msgTags[tagIdx] == tag) {
            return true;
        }
    }
    return false;
};
/**
 * Message text search filter.
 */
function LogHoundTextSearchFilter(searchText) {
    LogHoundTextSearchFilter.baseConstructor.call(this, 'lhTxtSearchFilter');
    this.searchText = searchText;
    this.regex = new RegExp(searchText, 'i');
}
FctsTools.extend(LogHoundTextSearchFilter, LogHoundMessageFilter);
LogHoundTextSearchFilter.prototype.showMessage = function(msgRec) {
    if(this.searchText=='') {
        return true;
    }
    var message = msgRec['text'];
    var result = msgRec['text'].search(this.regex);
    return msgRec['text'].search(this.regex)>=0;
}
/**
 * Message level filter.
 */
function LogHoundMessageLevelFilter() {
    LogHoundTextSearchFilter.baseConstructor.call(this, 'lhMsgLvlFilter');
}
FctsTools.extend(LogHoundMessageLevelFilter, LogHoundMessageFilter);
LogHoundMessageLevelFilter.prototype.showMessage = function(msgRec) {
    return msgRec['level'].isEnabled();
}
if(window['logHound']==null) {
    window['logHound'] = new LogHound();
}


