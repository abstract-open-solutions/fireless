FBL.ns(function() {
    with (FBL) {

        var log = Components.utils.reportError;
        var sl = Firebug.getRep(new FBL.SourceLink());

        function parseRule(rule) {
            var debugInfo = {};
            for (var j=0; j<rule.cssRules.length; j++) {
                var propValue = rule.cssRules[j].style.
                    getPropertyValue("font-family");
                var propName = rule.cssRules[j].selectorText;
                var quoted = /^\'.*\'$/;
                var dquoted = /^\".*\"$/;
                if(quoted.test(propValue) || dquoted.test(propValue)) {
                    propValue = propValue.substring(1, propValue.length-1);
                }
                debugInfo[propName] = propValue;
            }
            return debugInfo;
        }

        function parseRules(rules) {
            var debugInfo = null;
            for(var i=0; i<rules.length; i++) {
                var rule = rules[i];
                if(rule.type === CSSRule.MEDIA_RULE) {
                    if(rule.media.mediaText === "-sass-debug-info") {
                        debugInfo = parseRule(rule);
                    }
                }
                else {
                    if(rule.type === CSSRule.STYLE_RULE) {
                        if(debugInfo) {
                            rule.styleDebugInfo = debugInfo;
                        }
                    }
                }
            }
        }

        function cacheStyleDebugInfo(sourceLink) {
            // Already cached
            if(sourceLink.styleDebugInfo) { return; }
            // Not a CSS
            if(sourceLink.type != "css") {
                sourceLink.styleDebugInfo = {};
                return;
            }

            var stylesheet = sourceLink.object.parentStyleSheet;
            var parent = sourceLink.object.parentRule || stylesheet;
            parseRules(parent.cssRules);
            sourceLink.styleDebugInfo = sourceLink.object.styleDebugInfo || {};
            return;
        }

        var superGetSourceLinkTitle = sl.getSourceLinkTitle;
        sl.getSourceLinkTitle = function(sourceLink) {
            if (!sourceLink || !sourceLink.href ||
                typeof(sourceLink.href) !== 'string')
                return "";

            cacheStyleDebugInfo(sourceLink);

            if (sourceLink.styleDebugInfo &&
                sourceLink.styleDebugInfo["filename"]) {
                try {
                    var fileName = getFileName(
                        sourceLink.styleDebugInfo["filename"]);
                    fileName = decodeURIComponent(fileName);
                }
                catch(exc) {
                    if (FBTrace.DBG_ERRORS)
                        FBTrace.sysout(
                            "reps.getSourceLinkTitle decodeURIComponent "+
                                "fails for \'"+sourceLink.href+"\': "+exc,
                            exc);
                    fileName = sourceLink.styleDebugInfo["filename"];
                }

                var maxWidth = Firebug.sourceLinkLabelWidth;
                if (maxWidth > 0)
                    fileName = cropString(fileName, maxWidth);

                if(sourceLink.styleDebugInfo["line"]) {
                    return $STRF(
                        "Line",
                        [fileName, sourceLink.styleDebugInfo["line"]]);
                }
                else {
                    return fileName;
                }
            }
            return superGetSourceLinkTitle.apply(this, [sourceLink]);
        };

        sl.copyLink = function(sourceLink) {
            var filename = sourceLink.styleDebugInfo["filename"];
            if (filename)
                copyToClipboard(filename);
            else
                copyToClipboard(sourceLink.href);
        };

        sl.openInTab = function(sourceLink) {
            var filename = sourceLink.styleDebugInfo["filename"];
            if (filename)
                openNewTab(filename);
            else
                openNewTab(sourceLink.href);
        };

        sl.getTooltip = function(sourceLink) {
            var text;
            var href = sourceLink.styleDebugInfo["filename"] || sourceLink.href;
            try {
                text = decodeURI(href);
            }
            catch(exc) {
                if (FBTrace.DBG_ERRORS)
                    FBTrace.sysout(
                        "reps.getTooltip decodeURI fails for " +
                            href,
                        exc);
            }

            text = unescape(href);

            var lines = splitLines(text);
            if (lines.length < 10)
                return text;

            lines.splice(10);
            return lines.join("") + "...";
        };

        var oldInspectObject = sl.inspectObject;
        sl.inspectObject = function(sourceLink, context) {
            var filename = sourceLink.styleDebugInfo["filename"];
            if (filename) {
                this.openInTab(sourceLink, context);
                return true;
            }
            else
                return oldInspectObject.call(this, sourceLink, context);
        };
    }
});
