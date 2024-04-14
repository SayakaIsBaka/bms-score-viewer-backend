"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.match = void 0;
function match(text) {
    var matched = false;
    return {
        when: function (pattern, callback) {
            if (matched)
                return this;
            var match = text.match(pattern);
            if (match) {
                matched = true;
                callback(match);
            }
            return this;
        },
        else: function (callback) {
            if (matched)
                return this;
            callback();
        },
    };
}
exports.match = match;
//# sourceMappingURL=match.js.map