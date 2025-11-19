// ==UserScript==
// @name        Grafana Custom Time Span Navigator
// @namespace   Violentmonkey Scripts
// @match       https://grafana/*
// @grant       none
// @version     0.1
// @author      Jari Eskelinen <jari.eskelinen@iki.fi>
// @description Quick'n'dirty custom time span navigator for Grafana operating like humans expect. YMMV.
// @require		https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js
// @require		https://cdn.jsdelivr.net/npm/dayjs@1/plugin/localizedFormat.js
// @require		https://cdn.jsdelivr.net/npm/dayjs@1/plugin/customParseFormat.js
// @require		https://cdn.jsdelivr.net/npm/dayjs@1/locale/fi.js

// ==/UserScript==

(function () {
    "use strict";

    // Specify locale, also change @require tag above to include selected locale
    let locale = 'fi';

    class GrafanaCustomTimeSpanNavigator {

        constructor() {
            this.multiplier = 1;
            this.unit = "d";
            this.startDt = dayjs().hour(0).minute(0).second(0).millisecond(0);
            this.endDt = dayjs(this.startDt).add(1, 'd').add(-1, 's').millisecond(999);
        }

        onMultiplierChange(e) {
            let newValue = parseInt(e.target.value);
            if (isNaN(newValue)) {
                alert("Unable to parse: " + e.target.value);
            } else {
                this.multiplier = newValue;
            }
        }

        onUnitChange(e) {
            this.unit = e.target.value;
        }

        onStartChange(e) {
            let newValue = dayjs(e.target.value, 'L LTS');
            if (!newValue.isValid()) {
                alert("Unable to parse: " + e.target.value);
            } else {
                this.startDt = newValue;
                this.updateSpa();
            }
        }

        onEndChange(e) {
            let newValue = dayjs(e.target.value, 'L LTS');
            if (!newValue.isValid()) {
                alert("Unable to parse: " + e.target.value);
            } else {
                this.endDt = newValue;
                this.updateSpa();
            }
        }

        onPrev() {
            this.startDt = this.startDt.add(-this.multiplier, this.unit);
            this.endDt = this.endDt.add(-this.multiplier, this.unit);
            this.updateNavigator();
            this.updateSpa();
        }

        onNext() {
            this.startDt = this.startDt.add(this.multiplier, this.unit);
            this.endDt = this.endDt.add(this.multiplier, this.unit);
            this.updateNavigator();
            this.updateSpa();
        }

        injectNavigator() {
            let inputStyle = "height: 100%; padding: 0px 8px; background-color: #24252b; line-height: 1.57143; font-size: 14px; color: rgb(204, 204, 220); border: 1px solid rgba(204, 204, 220, 0.2);";
            let buttonStyle = inputStyle;
            this.domOobNavigator = $('[data-testid="data-testid dashboard controls"]');
            this.domStart = $(`<input style="${inputStyle}" type="text"/>`);
            this.domEnd = $(`<input style="margin-left: 1em; ${inputStyle}" type="text"/>`);
            this.domPrev = $(`<button style="margin-left: 1em; ${buttonStyle}">&lt;</button>`);
            this.domMultiplier = $(`<input style="width: 2em; ${inputStyle}" type="text"/>`);
            this.domUnit = $(`
              <select style="height: 100%; width: 6em; ${inputStyle}">
                <option value="s">seconds</option>
                <option value="m">minutes</option>
                <option value="h">hours</option>
                <option value="d">days</option>
                <option value="M">months</option>
                <option value="y">years</option>
              </select>`);
            this.domNext = $(`<button style="${buttonStyle}">&gt;</button>`);
            this.domMultiplier.on("change", this.onMultiplierChange.bind(this));
            this.domUnit.on("change", this.onUnitChange.bind(this));
            this.domStart.on("change", this.onStartChange.bind(this));
            this.domEnd.on("change", this.onEndChange.bind(this));
            this.domPrev.on("click", this.onPrev.bind(this));
            this.domNext.on("click", this.onNext.bind(this));
            this.domWrapper = $(
                '<div style="height: 2em; float: right; margin-right: 2em; margin-bottom: 1em;" id="grafana-Custom-time-Navigator"/>'
            );
            this.domWrapper.append(
                this.domStart,
                this.domEnd,
                this.domPrev,
                this.domMultiplier,
                this.domUnit,
                this.domNext
            );
            this.domOobNavigator.after(this.domWrapper);
            this.updateNavigator();
        }

        updateNavigator() {
            this.domMultiplier.val(this.multiplier);
            this.domUnit.val(this.unit);
            this.domStart.val(this.startDt.format('L LTS'));
            this.domEnd.val(this.endDt.format('L LTS'));
        }

        updateSpa() {
            let url = new URL(window.location.href);
            url.searchParams.set("from", this.startDt.toISOString());
            url.searchParams.set("to", this.endDt.toISOString());
            history.pushState({}, "", url.toString());
            window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
        }
    }

    // Initialize Day.js
    dayjs.extend(window.dayjs_plugin_localizedFormat);
    dayjs.extend(window.dayjs_plugin_customParseFormat);
    dayjs.locale(locale);

    // Create Time Span Navigator instance
    window.grafanaCustomTimeSpanNavigator = new GrafanaCustomTimeSpanNavigator();

    // Create observer for injecting Time Span Navigator
    let throttle = null;
    new MutationObserver((mutations, obs) => {
		if (!throttle) throttle = window.setTimeout(function(){
			if ($('[data-testid="data-testid dashboard controls"]').length > 0 && $("#grafana-Custom-time-Navigator").length <= 0)
				window.grafanaCustomTimeSpanNavigator.injectNavigator();
			throttle = null;
		}, 1000);
    }).observe(document.body, {childList: true, subtree: true});

})();
