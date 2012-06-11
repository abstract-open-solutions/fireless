FBL.ns(function() {
    with (FBL) {

        var sl = Firebug.getRep(new FBL.SourceLink());

        function cacheStyleDebugInfo(sourceLink) {
            // Already cached
            if (sourceLink.styleDebugInfo) { return; }
            // Not a CSS
            if (sourceLink.type != "css") {
                sourceLink.styleDebugInfo = {};
                return;
            }

            var rules = sourceLink.object.parentStyleSheet.cssRules;
            for(var i=0; i<rules.length-1; i++) {
                var styleRule = rules[i+1];
                if (styleRule.type != CSSRule.STYLE_RULE) continue;
                styleRule.styleDebugInfo = {};

                var mediaRule = rules[i];
                if (mediaRule.type != CSSRule.MEDIA_RULE) continue;

                if (mediaRule.media.mediaText != "-sass-debug-info") continue;

                for (var j=0; j<mediaRule.cssRules.length; j++)
                {
                    var propValue = mediaRule.cssRules[j].style.
                        getPropertyValue("font-family");
                    var propName = mediaRule.cssRules[j].selectorText;
                    var quoted = /^\'.*\'$/;
                    var dquoted = /^\".*\"$/;
                    if(quoted.test(propValue) || dquoted.test(propValue)) {
                        propValue = propValue.substring(1, propValue.length-1);
                    }
                    styleRule.styleDebugInfo[propName] = propValue;
                }
            }

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
                Components.utils.reportError(
                    "Cropped: "+fileName);

                if(sourceLink.styleDebugInfo["line"]) {
                    Components.utils.reportError(
                        "About to render: "+fileName+"@"+
                            sourceLink.styleDebugInfo["line"]);
                    return $STRF(
                        "Line",
                        [fileName, sourceLink.styleDebugInfo["line"]]);
                }
                else {
                    return fileName;
                }
            }
            Components.utils.reportError("Calling old implementation");
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
    }
});
