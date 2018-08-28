exports.fixUrl = url => url.replace(/\/{2,}/g, '/').replace(':/', '://');
exports.isUrl = url => url.indexOf('http') === 0 || url.indexOf('//') === 0;
exports.find = (arr, key, val) => arr.find(obj => val ? obj[key] === val : obj[key]);