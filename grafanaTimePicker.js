// ==UserScript==
// @name        Grafana Custom Time Picker
// @namespace   Violentmonkey Scripts
// @match       https://grafana/*
// @grant       none
// @version     1.0
// @author      Jari Eskelinen <jari.eskelinen@iki.fi>
// @description 11/18/2025, 10:37:38 PM
// ==/UserScript==

(function () {
    "use strict";

    class _datePicker {
        constructor(locale) {
            this.locale = locale || navigator.language || navigator.userLanguage;
            this.multiplier = 1;
            this.unit = "d";
            this.startDt = new Date();
            this.startDt.setHours(0);
            this.startDt.setMinutes(0);
            this.startDt.setSeconds(0);
            this.startDt.setMilliseconds(0);
            this.endDt = new Date(this.startDt);
            this.endDt.setDate(this.endDt.getDate() + 1);
            this.endDt.setSeconds(this.endDt.getSeconds() - 1);
            this.endDt.setMilliseconds(999);
        }

        onMultiplierChange(e) {
            var newValue = parseInt(e.target.value);
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
            var newValue = new Date(e.target.value);
            if (isNaN(newValue.valueOf())) {
                alert("Unable to parse: " + e.target.value);
            } else {
                this.startDt = newValue;
                this.updateSpa();
            }
        }

        onEndChange(e) {
            var newValue = new Date(e.target.value);
            if (isNaN(newValue.valueOf())) {
                alert("Unable to parse: " + e.target.value);
            } else {
                this.endDt = newValue;
                this.updateSpa();
            }
        }

        onPrev() {
            this.adjustRange(this.startDt, -this.multiplier);
            this.adjustRange(this.endDt, -this.multiplier);
        }

        onNext() {
            this.adjustRange(this.startDt, this.multiplier);
            this.adjustRange(this.endDt, this.multiplier);
        }

        adjustRange(dt, m) {
            if (this.unit == "s") this.addTime(dt, m, 0, 0, 0, 0, 0);
            else if (this.unit == "M") this.addTime(dt, 0, m, 0, 0, 0, 0);
            else if (this.unit == "H") this.addTime(dt, 0, 0, m, 0, 0, 0);
            else if (this.unit == "d") this.addTime(dt, 0, 0, 0, m, 0, 0);
            else if (this.unit == "m") this.addTime(dt, 0, 0, 0, 0, m, 0);
            else if (this.unit == "y") this.addTime(dt, 0, 0, 0, 0, 0, m);
            this.updatePicker();
            this.updateSpa();
        }

        addTime(dt, s, M, H, d, m, y) {
            if (s) dt.setSeconds(dt.getSeconds() + s);
            if (M) dt.setMinutes(dt.getMinutes() + M);
            if (H) dt.setHours(dt.getHours() + H);
            if (d) dt.setDate(dt.getDate() + d);
            if (m) dt.setMonth(dt.getMonth() + m);
            if (y) dt.setFullYear(dt.getFullYear() + y);
        }

        injectPicker() {
            var inputStyle =
                "height: 100%; padding: 0px 8px; background-color: #24252b; line-height: 1.57143; font-size: 14px; color: rgb(204, 204, 220); border: 1px solid rgba(204, 204, 220, 0.2);";
            var buttonStyle = inputStyle;
            this.domOobPicker = $('[data-testid="data-testid dashboard controls"]');
            this.domStart = $(`<input style="${inputStyle}" type="text"/>`);
            this.domEnd = $(`<input style="${inputStyle}" type="text"/>`);
            this.domPrev = $(`<button style="margin-left: 1em; ${buttonStyle}">&lt;</button>`);
            this.domMultiplier = $(`<input style="width: 2em; ${inputStyle}" type="text"/>`);
            this.domUnit = $(`
        <select style="height: 100%; width: 6em; ${inputStyle}">
          <option value="s">seconds</option>
          <option value="M">minutes</option>
          <option value="H">hours</option>
          <option value="d">days</option>
          <option value="m">months</option>
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
                '<div style="height: 2em; float: right; margin-right: 2em; margin-bottom: 1em;" id="grafana-custom-time-picker"/>'
            );
            this.domWrapper.append(
                this.domStart,
                this.domEnd,
                this.domPrev,
                this.domMultiplier,
                this.domUnit,
                this.domNext
            );
            this.domOobPicker.after(this.domWrapper);
            this.updatePicker();
        }

        updatePicker() {
            this.domMultiplier.val(this.multiplier);
            this.domUnit.val(this.unit);
            this.domStart.val(this.startDt.toLocaleString(this.locale));
            this.domEnd.val(this.endDt.toLocaleString(this.locale));
        }

        updateSpa() {
            var url = new URL(window.location.href);
            url.searchParams.set("from", this.startDt.toISOString());
            url.searchParams.set("to", this.endDt.toISOString());
            history.pushState({}, "", url.toString());
            window.dispatchEvent(new PopStateEvent("popstate", { state: history.state }));
        }
    }

    const observer = new MutationObserver((mutations, obs) => {
        if (
            $('[data-testid="data-testid dashboard controls"]').length > 0 &&
            $("#grafana-custom-time-picker").length <= 0
        ) {
            window._datePicker.injectPicker();
        }
    });

    window._datePicker = new _datePicker("fi-FI");
    observer.observe(document.body, { childList: true, subtree: true });
})();
