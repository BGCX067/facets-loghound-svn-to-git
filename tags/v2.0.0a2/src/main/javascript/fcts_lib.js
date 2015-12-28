/** 
 * Facets General Javascript Library
 * Version 1.0
 * Just a small collection of helper functions used by most of my javascript projects.
 * 
 * Developer Notes:
 * http://stackoverflow.com/questions/210377/get-all-elements-in-an-html-document-with-a-specific-css-class
 * http://robertnyman.com/2008/05/27/the-ultimate-getelementsbyclassname-anno-2008/
 * http://ejohn.org/blog/getelementsbyclassname-speed-comparison/
 */

var FctsJSLib = new Object();
FctsJSLib.Version = new Object();

if(!document.getElementsByClassName)
    document.getElementsByClassName = function(className){
    var classes = className.split(" ");
    var classesToCheck = "";
    var returnElements = [];
    var match, node, elements;

    if(document.evaluate) {    
        var xhtmlNamespace = "http://www.w3.org/1999/xhtml";
        var namespaceResolver = (document.documentElement.namespaceURI === xhtmlNamespace)? xhtmlNamespace:null;

        for(var j=0, jl=classes.length; j<jl;j+=1) {
            classesToCheck += "[contains(concat(' ', @class, ' '), ' " + classes[j] + " ')]"; 
        }
        try {
            elements = document.evaluate(".//*" + classesToCheck, document, namespaceResolver, 0, null);
        }
        catch(e) {
            elements = document.evaluate(".//*" + classesToCheck, document, null, 0, null);
        }
        while((match = elements.iterateNext())) {
            returnElements.push(match);
        }
    } else {
        classesToCheck = [];
        elements = (document.all) ? document.all : document.getElementsByTagName("*");
        for (var k=0, kl=classes.length; k<kl; k+=1) {
            classesToCheck.push(new RegExp("(^|\\s)" + classes[k] + "(\\s|$)"));
        }
        for(var l=0, ll=elements.length; l<ll;l+=1) {
            node = elements[l];
            match = false;
            for (var m=0, ml=classesToCheck.length; m<ml; m+=1) {
                match = classesToCheck[m].test(node.className);
                if(!match) { break; }
            }
            if(match) { returnElements.push(node); }
        } 
    }
    return returnElements;
}

document.addStyleClass = function(elmt, classname) {
    if(elmt.className==null || elmt.className=='') {
        elmt.className = classname;
        return;
    }
    var classes = elmt.className.split(' ');
    for(idx in classes) {
        if(classes[idx]==classname) {
            return;
        }
    }
    classes.push(classname);
    elmt.className = classes.join(' ');
}
document.removeStyleClass = function(elmt, classname) {
    if(elmt.className==null || elmt.className=='') {
        return;
    }
    if(elmt.className==classname) {
        elmt.className = '';
    }
    var classes = elmt.className.split(' ');
    var newNames = new Array();
    for(idx in classes) {
        if(classes[idx]==classname) {
            continue;
        }
        newNames.push(classes[idx]);
    }
    elmt.className = newNames.join(' ');
}
document.replaceStyleClass = function(elmt, remClass, addClass) {
    document.removeStyleClass(elmt, remClass);
    document.addStyleClass(elmt, addClass);
}
var FctsTools = new Array();
FctsTools.windowHeight = function() {
    return ((window.innerHeight) ? window.innerHeight : document.body.offsetHeight);
};
FctsTools.windowWidth = function() {
    return ((window.innerWidth) ? window.innerWidth : document.body.offsetWidth);
};
FctsTools.viewHeight = function() {
    return Math.max(document.documentElement.clientHeight,document.body.clientHeight);
};
FctsTools.viewWidth = function() {
    //return ((window.innerWidth) ? window.innerWidth : document.body.offsetWidth);
    //return document.body.offsetWidth;
    return Math.max(document.documentElement.clientWidth,document.body.clientWidth);
    //return document.body.scrollWidth;
    //return Math.min(document.body.clientWidth,document.body.offsetWidth);
};
FctsTools.scrollTop = function() {
    return document.body.scrollTop;
};
FctsTools.scrollLeft = function() {
    return document.body.scrollLeft;
};
FctsTools.typeOf = function(value) {
    var s = typeof value;
    if(s==='object') {
        if(value) {
            if(typeof value.length === 'number' &&
                    !(value.propertyIsEnumerable('length')) &&
                    typeof value.splice === 'function') {
                s = 'array';
            }
        } else {
            s = 'null';
        }
    }
    return s;
};
FctsTools.extend = function(subClass, baseClass) {
    function inheritance() {}
    inheritance.prototype = baseClass.prototype;
    subClass.prototype = new inheritance();
    subClass.prototype.constructor = subClass;
    subClass.baseConstructor = baseClass;
    subClass.superClass = baseClass.prototype;
};
FctsTools.removeSelected = function(selectElmt) {
    var selectedArray = new Array();
    var newArray = new Array();
    for(i=0;i<selectElmt.options.length;i++) {
        if(selectElmt.options[i].selected) {
            selectedArray[selectedArray.length] = selectElmt.options[i];
        } else {
            newArray[newArray.length] = selectElmt.options[i];
        }
    }
    FctsTools.setOptions(selectElmt,newArray);
    return selectedArray;
};
FctsTools.getSelected = function(selectElmt) {
    var selectedArray = new Array();
    for(idx in selectElmt.options) {
        if(selectElmt.options[idx].selected) {
            selectedArray[selectedArray.length] = selectElmt.options[idx];
        }
    }
    return selectedArray;
}
/**
 * Replaces all the select element's options with the argumented options.
 * @param selectElmt
 * @param options
 */
FctsTools.setOptions = function(selectElmt, options) {
    selectElmt.options.length = 0;
    for(idx in options) {
        selectElmt.options[selectElmt.options.length] = options[idx];
    }
};
/**
 * @param selectElmt The select element to which the argumented options will be added.
 * @param options An array object containing the options to add to the argumented select element.
 */
FctsTools.addOptions = function(selectElmt, options) {
    for(idx in options) {
        selectElmt.options[selectElmt.options.length] = options[idx];
    }
};
/**
 * Moves all selected options from one select element to another
 * @param fromSelectElmt
 * @param toSelectElmt
 */
FctsTools.moveSelected = function(fromSelectElmt, toSelectElmt) {
    FctsTools.addOptions(toSelectElmt, FctsTools.removeSelected(fromSelectElmt));
};
/**
 *
 * @param fromSelectElmt
 * @param toSelectElmt
 */
FctsTools.moveAllOptions = function(fromSelectElmt, toSelectElmt) {
    var tempOptArr = new Array();
    for(i=0; i<fromSelectElmt.options.length; i++) {
        tempOptArr[i] = fromSelectElmt.options[i];
    }
    for(i=0; i<tempOptArr.length; i++) {
        toSelectElmt.options[toSelectElmt.options.length] = tempOptArr[i];
    }
    fromSelectElmt.length = 0;
};
FctsTools.getOptionValues = function(selectElmt) {
    var valueArr = new Array();
    for(i=0; i<selectElmt.options.length; i++) {
        valueArr[i] = selectElmt.options[i].value;
    }
    return valueArr;
};
FctsTools.sortOptionsByText = function(selectElmt, sortFn) {
    var optionTemp = new Array();
    var optionText = new Array();
    for(i=0; i<selectElmt.options.length; i++) {
        optionTemp[i] = selectElmt.options[i];
        optionText[i] = selectElmt.options[i].text;
    }
    selectElmt.options.length = 0;
    if(sortFn == null || !sortFn) {
        optionText.sort();
    } else {
        optionText.sort(sortFn);
    }
    for(i=0; i<optionText.length; i++) {
        for(j=0; j<optionTemp.length; j++) {
            if(optionText[i] == optionTemp[j].text) {
                selectElmt.options[selectElmt.options.length] = optionTemp[j];
                optionTemp.splice(j--,1);
                continue;
            }
        }
    }
}
