/*! aiq-api-mock - Level5 - v1.2.0-f044a0 - 2014-03-13 */

var aiq = aiq || {
    version: '5',

    /**
     * Read mocked data from `/mock-data/{{name}}.json
     *
     * @note                    Should not be covered by the unittest
     *                          as exists in the Mocked Api only
     *
     * @param  {String} name    Mock type
     * @return {Object}         Mocked content
     */
    _getMockData: function (name) {
        var xhr;
        var path = 'mock-data/' + name + '.json';

        if (aiq.device.os === 'WinPhone') {
            xhr = new ActiveXObject('Microsoft.XMLHTTP');
            path = '../' + path;
        } else {
            xhr = new XMLHttpRequest();
        }

        try {
            xhr.open('GET', path, false);
            xhr.send(null);
        } catch (exception) {
            console.error('Request of \'' + path + '\' failed. ' + exception.message);
        }

        var json;
        if ((xhr.status === 200) ||
            // workaround for iOS simulator returning 0 for local files
            (xhr.status === 0)) {
            try {
                json = JSON.parse(xhr.responseText);
            } catch (exception) {
                console.error('Parsing of JSON at \'' + path + '\' failed. ' + exception.message);
            }
        }

        return json;
    },


    /**
     * Test if given url is reachable
     *
     * @note                     Should not be covered by the unittest
     *                           as exists in the Mocked Api only @note
     *
     * @param {String}   url     URL to test
     * @param {Function} success Called when URL is reachable
     * @param {Function) failure Called when URL is unreachable
     */
    _testURL: function(url, success, failure) {
        var img = document.createElement('img');
        img.src = url;
        img.onload = function() {
            if (typeof success === 'function') {
                success();
            }
        };
        img.onerror = function() {
            if (typeof failure === 'function') {
                failure();
            }
        };
    },

    /**
     *
     * @note                    Should not be covered by the unittest
     *                          as exists in the Mocked Api only
     *
     * @param  {Object} object
     * @param  {String} filter
     * @return {Object}
     */
    _cloneObject: function (object, filter) {
        var target = {};
        for (var key in object) {
            if ((object.hasOwnProperty(key)) &&
                ((! filter) || (! key.match(filter)))) {
                target[key] = object[key];
            }
        }
        return target;
    },

    /**
     *
     * @note                    Should not be covered by the unittest
     *                          as exists in the Mocked Api only
     *
     * @param  {Function} callback
     * @param  {String}   message
     * @param  {Object}   otherFlags
     * @return {Void}
     */
    _failWithMessage: function (callback, message, otherFlags) {
        if (typeof callback === 'function') {
            var arg = (typeof otherFlags === 'object') ? aiq._cloneObject(otherFlags) : {};
            arg.message = message;
            callback(arg);
        }
    },

    /**
     * Because "typeof []" returns "object", we use this function instead, written by Douglas Crockford
     * http://javascript.crockford.com/remedial.html
     *
     * @param value         The object to get type of
     * @returns {string}    The type of the passed object
     */
    _typeOf: function(value) {
        var s = typeof value;
        if (s === 'object') {
            if (value) {
                if (value instanceof Array) {
                    s = 'array';
                }
            } else {
                s = 'null';
            }
        }
        return s;
    },

    _doesSourceMatchPattern: function (source, pattern) {
        if ((source === undefined) || (pattern === undefined)) {
            return false;
        }
        
        var EPSILON = 0.000001;

        var result = true;
        var i;

        if (pattern === null) {
            result = (source === null);
        } else if ((source === null) || (source === undefined)) {
            result = false;
        } else if (aiq._typeOf(pattern) === 'object' && aiq._typeOf(source) === 'object') {
            // inception, we have to go deeper >_<
            var keys = Object.keys(pattern);
            for (i = 0; (i < keys.length) && (result); i++) {
                var key = keys[i];
                if (source.hasOwnProperty(key)) {
                    result = this._doesSourceMatchPattern(source[key], pattern[key]);
                } else {
                    result = false;
                }
            }
        }
        else if (aiq._typeOf(pattern) === 'array' && aiq._typeOf(source) === 'array') {
            // match array elements
            if (source.length === pattern.length) {
                for (i = 0; (i < source.length) && (result); i++) {
                    result = this._doesSourceMatchPattern(source[i], pattern[i]);
                }
            } else {
                result = false;
            }
        } else if (aiq._typeOf(pattern) === 'array' && ((aiq._typeOf(source) === 'number') || (aiq._typeOf(source) === 'boolean'))) {
            // texas range(r)
            if (pattern.length !== 2) {
                throw "Invalid range: " + JSON.stringify(pattern);
            } else {
                var leftConcrete = (pattern[0] !== null);
                var rightConcrete = (pattern[1] !== null);
                if ((leftConcrete) && (typeof pattern[0] !== 'number')) {
                    throw "Invalid range: " + JSON.stringify(pattern);
                } else if ((rightConcrete) && (typeof pattern[1] !== 'number')) {
                    throw "Invalid range: " + JSON.stringify(pattern);
                } else {
                    if (leftConcrete) {
                        result = ((Math.abs(source - pattern[0]) < EPSILON) || (source > pattern[0]));
                    }
                    if ((result) && (rightConcrete)) {
                        result = ((Math.abs(source - pattern[1]) < EPSILON) || (source < pattern[1]));
                    }
                }
            }
        } else if (aiq._typeOf(pattern) === 'number' && aiq._typeOf(source) === 'number') {
            // two numbers, ohai floating points!
            result = Math.abs(source - pattern) < EPSILON;
        } else {
            result = source.toString().match(pattern.toString()) !== null;
        }

        return result;
    }
};

// check for DOM ready - then wait for applicationId to be set
(function() {

    function checkComplete() {
        if (document.readyState !== 'complete') {
            // wait for DOM to load
            return setTimeout(checkComplete, 0);
        }

        aiq.datasync.createDocument('_launchable', {
            name: 'Mock application'
        }, {
            setupPartialIOSBridge: function() {
                aiq._executing = false;
                aiq._queue = [];
                aiq._bridge = document.createElement('iframe');
                aiq._bridge.setAttribute('width', '0px');
                aiq._bridge.setAttribute('height', '0px');
                aiq._bridge.setAttribute('frameborder', '0px');
                aiq._bridge.setAttribute('style', 'display: none');
                aiq._getCommandQueue = function() {
                    var json = JSON.stringify(aiq._queue);
                    aiq._queue = [];
                    return json;
                };
                aiq._callBridge = function(type,command) {
                    aiq._queue.push({
                        type: type,
                        command: command
                    });
                    if ((aiq._queue.length === 1) &&
                        (! aiq._executing) &&
                        (aiq._bridge !== null)) {
                        aiq._bridge.src = 'aiqjs://ready';
                    }
                };
                document.documentElement.appendChild(aiq._bridge);
                window.addEventListener('hashchange', function() {
                    var command = {
                        method: 'hashChanged',
                        hash: window.location.hash
                    };
                    aiq._callBridge('management', command);
                },false);
                ['log', 'debug', 'info', 'error', 'trace'].forEach(function(type) {
                    var original = window.console[type] || function() { /* do nothing */ };
                    window.console[type] = function(args) {
                        var command = {
                            method: 'log',
                            message: args
                        };
                        aiq._callBridge('management', command);
                        original.apply(window.console, arguments);
                    };
                });
            },
            success: function(doc) {
                aiq._applicationId = doc._id;

                if (aiq.device.os === 'iOS') {
                    this.setupPartialIOSBridge();
                } else {
                    // Extending window.console
                    ['debug', 'info', 'warn', 'error', 'trace'].forEach(function (type) {
                        if (! window.console[type]) {
                            window.console[type] = window.console.log.bind(console);
                        }
                    });
                }
                var e = document.createEvent('Events');
                e.initEvent('aiq-ready', false, false);
                document.dispatchEvent(e);
            }
        });

    }

    checkComplete();

})();

(function() {
    'use strict';
    
    if (! aiq.device) {
        var android = navigator.userAgent.match(/(Android)\s+([\d.]+)/);
        var ios = navigator.userAgent.match(/AIQ iOS ([\d.]+)/);
        var webos = navigator.userAgent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/);
        var blackberry = navigator.userAgent.match(/(BlackBerry).*Version\/([\d.]+)/);
        var webkit = navigator.userAgent.match(/WebKit\/([\d.]+)/);
        var safari = navigator.userAgent.match(/Safari\/([\d.]+)/);
        var chrome = navigator.userAgent.match(/Chrome\/([\d.]+)/);
        var firefox = navigator.userAgent.match(/Firefox\/([\d.]+)/);
        var ie = navigator.userAgent.match(/MSIE ([\d.]+)/);
        var winphone = navigator.userAgent.match(/Windows Phone ([\d.]+)/);

        aiq.device = {};

        if (chrome) {
            aiq.device.os = 'Chrome';
            aiq.device.version = chrome[1];
        } else if (safari) {
            aiq.device.os = 'Safari';
            aiq.device.version = safari[1];
        } else if (firefox) {
            aiq.device.os = 'Firefox';
            aiq.device.version = firefox[1];
        } else if (android) {
            aiq.device.os = 'Android';
            aiq.device.version = android[2];
        } else if (ios) {
            aiq.device.os = 'iOS';
            aiq.device.version = ios[1];
        } else if (webos) {
            aiq.device.os = 'WebOS';
            aiq.device.version = webos[2];
        } else if (blackberry) {
            aiq.device.os = 'BlackBerry';
            aiq.device.version = blackberry[2];
        } else if (webkit) {
            aiq.device.os = 'WebKit';
            aiq.device.version = webkit[1];
        } else if (winphone) {
            aiq.device.os = 'WinPhone';
            aiq.device.version = winphone[1];
        }
        else if (ie) {
            aiq.device.os = 'IE';
            aiq.device.version = ie[1];
        }

        // aiq.device.getNetworkInfo(callback)
        aiq.device.getNetworkInfo = function(callback) {
            if (typeof callback === 'function') {
                callback(true);
            }
        };
    }
})();

(function () {
    'use strict';

    if (!aiq.datasync) {
        aiq.datasync = {
            _documents: [],
            _attachments: {},
            _events: {}
        };

        var triggerEvent = function (event, property, args) {
            if (aiq.datasync._events.hasOwnProperty(event)) {
                var properties = aiq.datasync._events[event];
                if (properties.hasOwnProperty(property)) {
                    properties[property].forEach(function(callback) {
                        callback.apply(undefined, args);
                    });
                }
            }
        };

        // aiq.datasync.getDocument(id, [settings])
        aiq.datasync.getDocument = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                var document;
                aiq.datasync._documents.some(function (doc) {
                    if (doc._id === id) {
                        document = aiq._cloneObject(doc);
                        return true;
                    }
                    return false;
                });
                if (document) {
                    settings.success(document);
                } else {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                }
            }
        };

        // aiq.datasync.createDocument(type, fields, [settings])
        aiq.datasync.createDocument = function (type, fields, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (!fields || typeof fields !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid fields');
            } else {
                var id = fields._id || Date.now().toString(16) + '_' + aiq.datasync._documents.length;
                var document = aiq._cloneObject(fields, '^_');
                document._id = id;
                document._type = type;
                aiq.datasync._documents.push(document);
                triggerEvent('document-created', type, [id, true]);

                if (typeof settings.success === 'function') {
                    settings.success(document);
                }
            }
        };

        // aiq.datasync.updateDocument(id, fields, [settings])
        aiq.datasync.updateDocument = function (id, fields, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (!fields || typeof fields !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid fields');
            } else {
                var docIndex = -1;
                aiq.datasync._documents.some(function (doc, index) {
                    if (doc._id === id) {
                        docIndex = index;
                        return true;
                    }
                    return false;
                });
                if (docIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                } else {
                    var doc = aiq._cloneObject(fields, '^_');
                    doc._id = id;
                    doc._type = aiq.datasync._documents[docIndex]._type;
                    aiq.datasync._documents[docIndex] = doc;
                    triggerEvent('document-updated', doc._type, [id, true]);

                    if (typeof settings.success === 'function') {
                        settings.success(doc);
                    }
                }
            }
        };

        // aiq.datasync.deleteDocument(id, [settings])
        aiq.datasync.deleteDocument = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else {
                var docIndex = -1;
                aiq.datasync._documents.some(function (doc, index) {
                    if (doc._id === id) {
                        docIndex = index;
                        return true;
                    }
                    return false;
                });
                if (docIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                } else {
                    var type = aiq.datasync._documents[docIndex]._type;
                    aiq.datasync._documents.splice(docIndex, 1);
                    triggerEvent('document-deleted', type, [id, true]);

                    if (typeof settings.success === 'function') {
                        settings.success();
                    }
                }
            }
        };

        // aiq.datasync.getDocuments(type, [settings])
        aiq.datasync.getDocuments = function (type, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (typeof settings.success === 'function') {
                try {
                    var docs = [];
                    aiq.datasync._documents.forEach(function (doc) {
                        if (doc._type === type) {
                            if (!settings.filter ||
                                aiq._doesSourceMatchPattern(doc, settings.filter)) {

                                // Document object has to be copied because our spine
                                // model implementation renames _id fields to id.
                                docs.push(aiq._cloneObject(doc));
                            }
                        }
                    });
                    settings.success(docs);
                } catch (error) {
                    aiq._failWithMessage(settings.error, error.message);
                }
            }
        };

        // aiq.datasync.getAttachment(id, name, [settings])
        aiq.datasync.getAttachment = function (id, name, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else if (typeof settings.success === 'function') {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function () {
                        var attachments = aiq.datasync._attachments[id] || {};
                        var attachment = attachments[name];
                        if (attachment) {
                            settings.success({
                                name: name,
                                contentType: attachment.contentType,
                                resourceId: attachment.resourceUrl, // backward compatibility
                                resourceUrl: attachment.resourceUrl,
                                state: 'available'
                            });
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment not found');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        var storeAttachment = function (id, name, descriptor, callback) {
            var attachments = aiq.datasync._attachments[id] || {};
            attachments[name] = {
                contentType: descriptor.contentType,
                resourceUrl: descriptor.resourceUrl
            };
            aiq.datasync._attachments[id] = attachments;
            triggerEvent('attachment-available', id, [id, name]);
            triggerEvent('attachment-available', id + ':' + name, [id, name]);

            if (typeof callback === 'function') {
                callback({
                    name: name,
                    contentType: descriptor.contentType,
                    resourceUrl: descriptor.resourceUrl,
                    state: 'available'
                });
            }
        };

        // aiq.datasync.createAttachment(id, descriptor, [settings])
        aiq.datasync.createAttachment = function (id, descriptor, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof descriptor !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid descriptor');
            } else if (typeof descriptor.contentType !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid content type');
            } else if (typeof descriptor.resourceUrl !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid resource URL');
            } else {
                aiq.datasync.getDocument(id, {
                    success: function () {
                        aiq._testURL(descriptor.resourceUrl, function () {
                            var attachments = aiq.datasync._attachments[id] || {};
                            var name = descriptor.name || id + '_' + Object.keys(attachments).length;
                            if (attachments.hasOwnProperty(name)) {
                                aiq._failWithMessage(settings.failure, 'Attachment already exists');
                            } else {
                                storeAttachment(id, name, descriptor, settings.success);
                            }
                        }, function () {
                            aiq._failWithMessage(settings.failure, 'Resource not found');
                        });
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.datasync.updateAttachment(id, name, descriptor, [settings])
        aiq.datasync.updateAttachment = function (id, name, descriptor, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else if (typeof descriptor !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid descriptor');
            } else if (typeof descriptor.contentType !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid content type');
            } else if (typeof descriptor.resourceUrl !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid resource URL');
            } else {
                aiq.datasync.getDocument(id, {
                    success: function () {
                        var attachments = aiq.datasync._attachments[id] || {};
                        if (attachments.hasOwnProperty(name)) {
                            aiq._testURL(descriptor.resourceUrl, function () {
                                storeAttachment(id, name, descriptor, settings.success);
                            }, function () {
                                aiq._failWithMessage(settings.failure, 'Resource not found');
                            });
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment does not exist');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.datasync.deleteAttachment(id, name, [settings])
        aiq.datasync.deleteAttachment = function (id, name, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function () {
                        var attachments = aiq.datasync._attachments[id] || {};
                        if (attachments.hasOwnProperty(name)) {
                            delete attachments[name];

                            if (typeof settings.success === 'function') {
                                settings.success();
                            }
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment not found');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }

        };

        // aiq.datasync.getAttachments(id, [settings])
        aiq.datasync.getAttachments = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                // Let's make sure that the document exists
                aiq.datasync.getDocument(id, {
                    success: function () {
                        var attachments = aiq.datasync._attachments[id] || {};
                        var result = Object.keys(attachments).map(function (name) {
                            return {
                                name: name,
                                contentType: attachments[name].contentType,
                                resourceId: attachments[name].resourceUrl, // backward compatibility
                                resourceUrl: attachments[name].resourceUrl,
                                state: 'available'
                            };
                        });
                        settings.success(result);
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.datasync.synchronize()
        aiq.datasync.synchronize = function () {
            setTimeout(function () {
                triggerEvent('synchronization-complete', '__global', []);
            }, 1500);
        };

        // aiq.datasync.bind()
        aiq.datasync.bind = function (event, settings) {
            if (typeof event !== 'string') {
                return;
            }
            if (typeof settings !== 'object') {
                return;
            }
            if (typeof settings.callback !== 'function') {
                return;
            }

            var registerCallback = function(event, property, callback) {
                var properties = aiq.datasync._events[event] || {};
                var callbacks = properties[property] || [];
                callbacks.push(callback);
                properties[property] = callbacks;
                aiq.datasync._events[event] = properties;
            };

            if (event.indexOf('document-') === 0) {
                // document event
                if (typeof settings._type !== 'string') {
                    return;
                }
                registerCallback(event, settings._type, settings.callback);
            } else if (event.indexOf('attachment-') === 0) {
                // attachment event
                if (typeof settings._id !== 'string') {
                    return;
                }
                if (typeof settings.name === 'string') {
                    registerCallback(event, settings._id + ':' + settings.name, settings.callback);
                } else {
                    registerCallback(event, settings._id, settings.callback);
                }
            } else if (event.indexOf('synchronization-') === 0) {
                // synchronization event
                registerCallback(event, '__global', settings.callback);
            }
        };

        // aiq.datasync.bindDocumentEvent()
        console.warn("bindDocumentEvent() is deprecated, use bind() instead");
        aiq.datasync.bindDocumentEvent = function (event, type, callback) {
            aiq.datasync.bind(event, {
                _type: type,
                callback: callback
            });
        };

        // aiq.datasync.bindAttachmentEvent()
        aiq.datasync.bindAttachmentEvent = function (event, id, name, callback) {
            console.warn("bindAttachmentEvent() is deprecated, use bind() instead");
            aiq.datasync.bind(event, {
                _id: id,
                name: name,
                callback: callback
            });
        };

        // aiq.datasync.bindEvent()
        aiq.datasync.bindEvent = function (event, callback) {
            console.warn("bindEvent() is deprecated, use bind() instead");
            aiq.datasync.bind(event, {
                callback: callback
            });
        };

        // aiq.datasync.unbind()
        aiq.datasync.unbind = function (callback) {
            if (typeof callback === 'function') {
                Object.keys(aiq.datasync._events).forEach(function(event) {
                    var properties = aiq.datasync._events[event];
                    Object.keys(properties).forEach(function(property) {
                        var callbacks = properties[property];
                        var index;
                        while ((index = callbacks.indexOf(callback)) !== -1) {
                            callbacks.splice(index, 1);
                        }
                        if (callbacks.length === 0) {
                            delete properties[property];
                        } else {
                            properties[property] = callbacks;
                        }
                    });
                    if (Object.keys(properties).length === 0) {
                        delete aiq.datasync._events[event];
                    } else {
                        aiq.datasync._events[event] = properties;
                    }
                });
            }
        };

        // aiq.datasync.getConnectionStatus()
        aiq.datasync.getConnectionStatus = function (callback) {
            if (typeof callback === 'function') {
                callback(true);
            }
        };

        var json = aiq._getMockData('datasync');
        if ((json) && (typeof json === 'object') && (json.hasOwnProperty('documents'))) {
            json.documents.forEach(function (doc) {
                aiq.datasync.createDocument(doc._type, doc);
            });

            if (json.hasOwnProperty('attachments')) {
                Object.keys(json.attachments).forEach(function (id) {
                    var attachments = json.attachments[id];
                    Object.keys(attachments).forEach(function (name) {
                        var attachment = attachments[name];
                        if ((typeof attachment.contentType === 'string') &&
                            (typeof attachment.path === 'string')) {
                            aiq.datasync.createAttachment(id, {
                                name: name,
                                resourceUrl: 'mock-data/attachments/' + attachment.path,
                                contentType: attachment.contentType
                            });
                        }
                    });
                });
            }
        }
    }
})();

(function () {
    'use strict';

    if (!aiq.client) {
        var MAX_BUTTONS = 3;

        var createButton = function (id, image, label, enabled, visible) {
            var button = document.createElement('a');
            button.setAttribute('data-id', id);
            button.setAttribute('class', 'aiq-bar-button-item');
            button.style.display = 'inline-block';
            button.style.position = 'fixed';
            button.style.top = '-1px';
            button.style.zIndex = '999';
            button.style.height = '25px';
            button.style.lineHeight = '25px';
            button.style.width = (label) ? '110px' : '25px';
            button.style.overflow = 'hidden';
            button.style.textOverflow = 'ellipsis';
            button.style.whiteSpace = 'nowrap';
            button.style.paddingLeft = '25px';
            button.style.paddingRight = '1px';
            button.style.boxSizing = 'border-box';
            button.style.fontSize = '12px';
            button.style.border = '1px solid black';
            button.style.backgroundColor = 'white';
            button.style.fontFamily = 'Arial';

            if (!visible) {
                button.style.display = 'none';
            }

            if (label) {
                button.innerHTML = label;
            }

            var img = document.createElement('img');
            img.style.position = 'absolute';
            img.style.top = '1px';
            img.style.left = '1px';
            img.style.width = '23px';
            img.style.height = '23px';
            if (enabled) {
                button.style.cursor = 'pointer';
                button.style.color = 'black';
            } else {
                button.style.cursor = 'default';
                button.style.color = '#d0d0d0';
                button.style.pointerEvents = 'none';
                img.style.opacity = '.4';
            }
            img.setAttribute('src', image);
            button.appendChild(img);

            return button;
        };

        var getButtons = function () {
            return [].slice.call(document.getElementsByClassName('aiq-bar-button-item'));
        };

        var getButtonDescriptors = function () {
            var buttonDescriptors = [];

            var buttons = getButtons();
            buttons.forEach(function (button) {
                var descriptor = {
                    id: button.getAttribute('data-id'),
                    image: button.children[0].getAttribute('src'),
                    label: button.innerText,
                    enabled: (button.style.pointerEvents !== 'none'),
                    visible: (button.style.display !== 'none'),
                    onClick: button.onclick
                };
                buttonDescriptors.push(descriptor);
            });

            return buttonDescriptors;
        };

        var refreshNavbar = function (buttonDescriptors) {
            var _buttons = getButtons();
            _buttons.forEach(function (button) {
                if (button.getAttribute('data-id') !== 'back') {
                    document.body.removeChild(button);
                }
            });

            var position = -1;
            buttonDescriptors.forEach(function (descriptor) {
                var button = createButton(
                    descriptor.id,
                    descriptor.image,
                    descriptor.label,
                    descriptor.enabled,
                    descriptor.visible);
                button.style.right = position + 'px';
                if (descriptor.visible) {
                    // magic numbers are magic just to ensure that two
                    // neighboring buttons share only one border
                    if (descriptor.label) {
                        position += 109;
                    }
                    else {
                        position += 27;
                    }
                }
                button.onclick = descriptor.onClick;
                document.body.appendChild(button);
            });
        };

        var countVisibleButtons = function () {
            var buttonDescriptors = getButtonDescriptors();

            return buttonDescriptors.reduce(function (previous, current) {
                return previous + (current.visible ? 1 : 0);
            }, 0);
        };

        aiq.client = {
            version: '1.0.0'
        };

        // aiq.client.closeApp()
        aiq.client.closeApp = function () {
            // do nothing
        };

        // aiq.client.getAppArguments()
        aiq.client.getAppArguments = function () {
            var args = {};
            if (window.location.search.length !== 0) {
                window.location.search.substring(1).split('&').forEach(function (param) {
                    var pair = param.split('=');
                    args[pair[0]] = (pair.length === 2) ? pair[1] : null;
                });
            }
            return args;
        };

        // aiq.client.setAppTitle(title)
        aiq.client.setAppTitle = function (title) {
            document.title = title;
        };

        // aiq.client.getCurrentUser(callbacks)
        aiq.client.getCurrentUser = function (callbacks) {
            callbacks = callbacks || {};

            if (aiq.client.hasOwnProperty('_userProfile')) {
                if (typeof callbacks.success === 'function') {
                    callbacks.success(aiq._cloneObject(aiq.client._userProfile));
                }
            } else {
                if (typeof callbacks.error === 'function') {
                    if (aiq.client.hasOwnProperty('_userProfileError')) {
                        callbacks.error({
                            message: aiq.client._userProfileError
                        });
                    } else {
                        callbacks.error({
                            message: 'Missing user profile'
                        });
                    }
                }
            }
        };

        aiq.client.navbar = {};

        // private function, used by the test suite to clean the
        // navigation bar, though it doesn't call any public APIs
        aiq.client.navbar._clean = function (callback) {
            var buttons = document.getElementsByClassName('aiq-bar-button-item');
            for (var i = 0; i < buttons.length;) {
                document.body.removeChild(buttons[i]);
            }

            if (typeof callback === 'function') {
                callback();
            }
        };

        aiq.client.navbar.addButton = function (properties, settings) {
            properties = properties || {};
            settings = settings || {};

            if (!properties.hasOwnProperty('image')) {
                aiq._failWithMessage(settings.failure, 'Image not specified');
                return;
            }
            if (typeof properties.onClick !== 'function') {
                aiq._failWithMessage(settings.failure, 'Callback not specified');
                return;
            }
            if (!properties.hasOwnProperty('enabled')) {
                properties.enabled = true;
            }
            if (!properties.hasOwnProperty('visible')) {
                properties.visible = true;
            }

            if ((properties.visible) && (countVisibleButtons() === MAX_BUTTONS)) {
                aiq._failWithMessage(settings.failure, 'Too many visible buttons');
                return;
            }

            var buttonDescriptors = getButtonDescriptors();
            var descriptor = {
                id: Date.now().toString(16) + '_' + buttonDescriptors.length,
                image: properties.image,
                label: properties.label,
                enabled: properties.enabled,
                visible: properties.visible,
                onClick: properties.onClick
            };
            buttonDescriptors.push(descriptor);

            refreshNavbar(buttonDescriptors);

            if (typeof settings.success === 'function') {
                settings.success(aiq._cloneObject(descriptor));
            }
        };

        aiq.client.navbar.updateButton = function (id, properties, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Identifier not specified');
            }
            else {
                var buttonDescriptors = getButtonDescriptors();

                var result = buttonDescriptors.some(function (descriptor) {
                    if (descriptor.id === id) {
                        if (properties.hasOwnProperty('visible')) {
                            if ((!descriptor.visible) && (properties.visible) && (countVisibleButtons() === MAX_BUTTONS)) {
                                aiq._failWithMessage(settings.failure, 'Too many visible buttons');
                                return true;
                            } else {
                                descriptor.visible = properties.visible;
                            }
                        }
                        if (properties.hasOwnProperty('image')) {
                            descriptor.image = properties.image;
                        }
                        if (properties.hasOwnProperty('label')) {
                            descriptor.label = properties.label;
                        }
                        if (properties.hasOwnProperty('enabled')) {
                            descriptor.enabled = properties.enabled;
                        }
                        refreshNavbar(buttonDescriptors);
                        if (typeof settings.success === 'function') {
                            settings.success(aiq._cloneObject(descriptor));
                        }
                        return true;
                    }
                    else {
                        return false;
                    }
                }, this);
                if (!result) {
                    aiq._failWithMessage(settings.failure, 'Button not found');
                }
            }
        };

        aiq.client.navbar.deleteButton = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Identifier not specified');
            }
            else {
                var buttonDescriptors = getButtonDescriptors();

                var result = buttonDescriptors.some(function (descriptor, index) {
                    if (descriptor.id === id) {
                        buttonDescriptors.splice(index, 1);
                        refreshNavbar(buttonDescriptors);

                        if (typeof settings.success === 'function') {
                            settings.success();
                        }
                        return true;
                    }
                    else {
                        return false;
                    }
                }, this);
                if (!result) {
                    aiq._failWithMessage(settings.failure, 'Button not found');
                }
            }
        };

        aiq.client.navbar.getButton = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Identifier not specified');
            }
            else if (typeof settings.success === 'function') {
                var buttonDescriptors = getButtonDescriptors();

                var found = buttonDescriptors.some(function (descriptor) {
                    if (descriptor.id === id) {
                        settings.success(aiq._cloneObject(descriptor));
                        return true;
                    }
                    else {
                        return false;
                    }
                });
                if (!found) {
                    aiq._failWithMessage(settings.failure, 'Button not found');
                }
            }
        };

        aiq.client.navbar.getButtons = function (settings) {
            settings = settings || {};

            if (typeof settings.success === 'function') {
                var buttonDescriptors = getButtonDescriptors();

                settings.success(buttonDescriptors);
            }
        };
    }

    var json = aiq._getMockData('client');
    if ((json) && (typeof json === 'object') &&
        (json.currentUser) && (typeof json.currentUser === 'object')) {
        var user = json.currentUser;
        var currentUser = {
            _id: user._id || Date.now().toString(16),
            username: user.username
        };

        if (typeof currentUser.username === 'string') {
            if (typeof user.email === 'string') {
                currentUser.email = user.email;
            }
            if (typeof user.fullName === 'string') {
                currentUser.fullName = user.fullName;
            }
            if ((user.profile) && (typeof user.profile === 'object')) {
                currentUser.profile = user.profile;
            } else {
                currentUser.profile = {};
            }
            if (user.roles instanceof Array) {
                currentUser.roles = user.roles;
            } else {
                currentUser.roles = [];
            }
            if (user.groups instanceof Array) {
                currentUser.groups = user.groups;
            } else {
                currentUser.groups = [];
            }
            if (user.permissions instanceof Array) {
                currentUser.permissions = user.permissions;
            } else {
                currentUser.permissions = [];
            }
            aiq.client._userProfile = currentUser;
        }
        else {
            aiq.client._userProfileError = 'Username not specified';
        }
    }
    else {
        aiq.client._userProfile = {
            _id: '_userprofile',
            username: 'jdoe',
            email: 'jdoe@example.org',
            fullName: 'John Doe',
            profile: {},
            roles: [],
            groups: [],
            permissions: []
        };
    }
})();
(function() {
    'use strict';
    
    if (! aiq.context) {
        aiq.context = {};

        var getContext = function(type, name, success, failure, error) {
            aiq.datasync.getDocuments(type, {
                success: function(docs) {
                    if ((docs.length === 1)&& (docs[0].hasOwnProperty(name))) {
                        success(docs[0][name]);
                    } else {
                        aiq._failWithMessage(failure, 'Provider not found');
                    }
                },
                failure: failure,
                error: error
            });
        };

        // aiq.context.getGlobal(providerName, [settings])
        aiq.context.getGlobal = function(providerName, settings) {
            settings = settings || {};

            if (typeof providerName !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid provider name');
            } else if (typeof settings.success === 'function') {
                // Let's start by trying to retrieve the client context document
                getContext(
                    '_clientcontext',
                    providerName,
                    function(context) {
                        // If it's there and it has the requested key, we just
                        // return it
                        settings.success(context);
                    },
                    function() {
                        // Otherwise let's try to retrieve the backend context document
                        getContext(
                            '_backendcontext',
                            providerName,
                            function(context) {
                                // It has the requested key so let's return it
                                settings.success(context);
                            },
                            settings.failure,
                            settings.error);
                    }, settings.error);
            }
        };

        // aiq.context.getLocal(key, [settings])
        aiq.context.getLocal = function(key, settings) {
            settings = settings || {};

            if (typeof key !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid context key');
            } else if (typeof settings.success === 'function') {
                // Application ('local') context sits under com.appearnetworks.aiq.apps
                // context provider in the client context document so let's try and
                // retrieve it
                getContext(
                    '_clientcontext',
                    'com.appearnetworks.aiq.apps',
                    function(apps) {
                        if (apps.hasOwnProperty(key)) {
                            settings.success(apps[key]);
                        } else {
                            aiq._failWithMessage(settings.failure, 'Context key not found');
                        }
                    },
                    settings.failure,
                    settings.error);
            }
        };

        // aiq.context.setLocal(key, value, [settings])
        aiq.context.setLocal = function(key, value, settings) {
            settings = settings || {};

            if (typeof key !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid context key');
            } else {
                // Let's see if we already have a client context document in
                // the data sync storage
                aiq.datasync.getDocuments('_clientcontext', {
                    success: function(docs) {
                        if (docs.length === 0) {
                            // Nope, let's create one with the new key-value pair
                            var fields = {
                                'com.appearnetworks.aiq.apps': {}
                            };
                            fields['com.appearnetworks.aiq.apps'][key] = value;
                            aiq.datasync.createDocument('_clientcontext', fields, {
                                success: function() {
                                    if (typeof settings.success === 'function') {
                                        settings.success();
                                    }
                                },
                                failure: settings.failure,
                                error: settings.error
                            });
                        } else if (docs.length === 1) {
                            // It looks like we already have it, let's add new key-value
                            // pair to it and update the document
                            var doc = docs[0];
                            doc['com.appearnetworks.aiq.apps'][key] = value;
                            aiq.datasync.updateDocument(doc._id, doc, {
                                success: function() {
                                    if (typeof settings.success === 'function') {
                                        settings.success();
                                    }
                                },
                                failure: settings.failure,
                                error: settings.error
                            });
                        }
                    },
                    failure: settings.failure,
                    error: settings.failure
                });
            }
        };

        var json = aiq._getMockData('context');
        if (json) {
            var cleanupAndPopulate = function(type, fields) {
                aiq.datasync.getDocuments(type, {
                    success: function(docs) {
                        docs.forEach(function(doc) {
                            aiq.datasync.deleteDocument(doc._id);
                        });
                        aiq.datasync.createDocument(type, fields);
                    }
                });
            };
            if ((json.hasOwnProperty('local')) && (typeof json.local === 'object')) {
                var doc = {
                    "com.appearnetworks.aiq.apps": json.local
                };
                cleanupAndPopulate('_clientcontext', doc);
            }
            if ((json.hasOwnProperty('global')) && (typeof json.global === 'object')) {
                cleanupAndPopulate('_backendcontext', json.global);
            }
        }
    }
})();

(function() {
    'use strict';
    
    if (!aiq.directcall) {
        aiq.directcall = {};

        // Checks the value against given regular expression pattern.
        var checkRegexp = function(pattern, value) {
            var match = value.match(pattern);
            return (match !== null) && (match.length === 1) && (match[0] === value);
        };

        // Tells whether two objects match using regular expressions from the
        // right object.
        var objectsMatch = function(left, right, property) {
            if (typeof left[property] === 'object') {
                return !Object.keys(left[property]).some(function(key) {
                    if (right.hasOwnProperty(property)) {
                        if (left.hasOwnProperty(property)) {
                            return ! checkRegexp('' + left[property][key], '' + right[property][key]);
                        } else {
                            return true;
                        }
                    } else {
                        return false;
                    }
                });
            } else {
                return checkRegexp('' + left[property], '' + right[property]);
            }
        };

        // Handles the old format of the mock data input, in which params, errorCode and data
        // were all on the same level.
        var handleOldInput = function(args, inputs, settings) {
            var found;
            inputs.some(function(input) {
                if (args.hasOwnProperty('params')) {
                    if ((input.hasOwnProperty('params')) && (typeof input.params === 'object')) {
                        for (var param in input.params) {
                            if (input.params.hasOwnProperty(param)) {
                                return checkRegexp('' + input.params[param], '' + args.params[param]);
                            }
                        }
                        found = input;
                        return true;
                    } else {
                        return false;
                    }
                } else if (! input.hasOwnProperty('params')) {
                    found = input;
                    return true;
                }
            });
            if (found) {
                if (found.hasOwnProperty('errorCode')) {
                    aiq._failWithMessage(settings.failure, 'Invalid response', { errorCode: found.errorCode });
                } else if (found.hasOwnProperty('data')) {
                    settings.success(found.data);
                } else {
                    aiq._failWithMessage(settings.error, 'Invalid mock file');
                }
                return true;
            } else {
                return false;
            }
        };

        // Handles the new format of the mock data input, in which all input parameters are
        // stored under "query" key and the output response code, headers and body is stored
        // under "response" key. Neato!
        var handleNewInput = function(args, inputs, settings) {
            var found;
            inputs.some(function(input) {
                if ((objectsMatch(input.query, args, 'params')) &&
                    (objectsMatch(input.query, args, 'headers')) &&
                    (objectsMatch(input.query, args, 'contentType'))) {
                    found = input;
                    return true;
                }
                return false;
            });

            if (found) {
                var status = parseInt(found.response.status, 10);
                if ((status >= 200) && (status < 300)) {
                    // success
                    if (found.response.contentType) {
                        if ((found.response.contentType === 'application/json') ||
                            (found.response.contentType.indexOf('text/') === 0)) {
                            settings.success(found.response.body, {
                                status: status,
                                headers: found.response.headers || {},
                                contentType: found.response.contentType
                            });
                        } else {
                            settings.success(found.response.resourceUrl, {
                                status: status,
                                headers: found.response.headers || {},
                                contentType: found.response.contentType
                            });
                        }
                    } else {
                        settings.success(
                            found.response.body || found.response.resourceUrl, {
                                status: status,
                                headers: found.response.headers || {},
                                contentType: found.response.contentType
                            });
                    }
                } else {
                    // failure
                    aiq._failWithMessage(
                        settings.failure,
                        'Invalid response', {
                            errorCode: status,
                            headers: found.response.headers || {},
                            contentType: found.response.contentType || null,
                            body: found.response.body || null,
                            resourceUrl: found.response.resourceUrl || null
                        });
                }
                return true;
            } else {
                return false;
            }
        };

        // Performs a direct call based on the given method.
        var call = function(method, args, settings) {
            settings = settings || {};
            args = args || {};

            if (typeof args.endpoint !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid endpoint');
            } else if ((args.hasOwnProperty('params')) && (typeof args.params !== 'object')) {
                aiq._failWithMessage(settings.failure, 'Invalid params');
            } else if ((args.hasOwnProperty('headers')) && (typeof args.headers !== 'object')) {
                aiq._failWithMessage(settings.failure, 'Invalid headers');
            } else if (((method === 'get') ||
                        (method === 'delete')) &&
                       ((args.hasOwnProperty('contentType')) ||
                        (args.hasOwnProperty('body')) ||
                        (args.hasOwnProperty('resourceUrl')))) {
                aiq._failWithMessage(settings.failure, 'Method does not accept body parameters');
            } else if ((args.hasOwnProperty('body')) && (args.hasOwnProperty('resourceUrl'))) {
                aiq._failWithMessage(settings.failure, 'Body and resource URL are exclusive');
            } else if ((args.hasOwnProperty('body')) && (args.hasOwnProperty('contentType'))) {
                aiq._failWithMessage(settings.failure, 'Body parameters does not support forced content type');
            } else if (typeof settings.success === 'function') {
                // It only makes sense to perform a call when there is a callback to consume its
                // result
                var json = aiq._getMockData('directcall-' + args.endpoint);
                if (json) {
                    if (json.hasOwnProperty(method)) {
                        var inputs = json[method];
                        var found;
                        // Let's check which input  type we're getting here
                        if ((inputs) &&
                            (inputs.length !== 0) &&
                            (inputs[0].hasOwnProperty('query')) &&
                            (inputs[0].hasOwnProperty('response'))) {
                            // It's the new one, cool
                            found = handleNewInput(args, inputs, settings);
                        } else {
                            // Old input type, let's fall back to the old behavior
                            found = handleOldInput(args, inputs, settings);
                        }
                        
                        if (! found) {
                            aiq._failWithMessage(settings.failure, 'No matching responses', { errorCode: 404 });
                        }
                    } else {
                        aiq._failWithMessage(settings.failure, 'Unsupported method', { status: 404 });
                    }
                } else {
                    aiq._failWithMessage(settings.failure, 'Endpoint not found', { status: 404 });
                }
            }
        };

        // aiq.directcall.getResource(args, [settings])
        aiq.directcall.getResource = function(args, settings) {
            call('get', args, settings);
        };

        // aiq.directcall.postResource(args, [settings])
        aiq.directcall.postResource = function(args, settings) {
            call('post', args, settings);
        };

        // aiq.directcall.putResource(args, [settings])
        aiq.directcall.putResource = function(args, settings) {
            call('put', args, settings);
        };

        // aiq.directcall.deleteResource(args, [settings])
        aiq.directcall.deleteResource = function(args, settings) {
            call('delete', args, settings);
        };
    }
})();

(function() {
    'use strict';
    
    if (! aiq.external) {
        aiq.external = {};

        // aiq.external.openMap(settings)
        aiq.external.openMap = function(settings) {
            settings = settings || {};

            if (! settings.hasOwnProperty('latitude')) {
                aiq._failWithMessage(settings.failure, 'Latitude not specified');
            } else if (! settings.hasOwnProperty('longitude')) {
                aiq._failWithMessage(settings.failure, 'Longitude not specified');
            } else {
                var latitude = parseFloat(settings.latitude);
                var longitude = parseFloat(settings.longitude);
                if (isNaN(latitude)) {
                    aiq._failWithMessage(settings.failure, 'Invalid latitude value');
                } else if (isNaN(longitude)) {
                    aiq._failWithMessage(settings.failure, 'Invalid longitude value');
                } else {
                    var url = 'https://maps.google.com/maps?';
                    if (settings.hasOwnProperty('label')) {
                        url += 'q=' + settings.label + '@';
                    } else {
                        url += 'll=';
                    }
                    url += latitude + ',' + longitude;
                    if (settings.hasOwnProperty('zoom')) {
                        var zoom = parseInt(settings.zoom, 10);
                        if (! isNaN(zoom)) {
                            url += '&z=' + zoom;
                        }
                    }
                    var win = window.open(url, '_blank');
                    win.focus();
                }
            }
        };
    }
})();

(function() {
    'use strict';
    if (! aiq.imaging) {
        aiq.imaging = {};

        // aiq.imaging.capture(id, [settings]) - deprecated
        // aiq.imaging.capture(settings)
        aiq.imaging.capture = function (idOrSettings, settingsOrNil) {
            var resourceUrl = 'data:image/png;base64,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';
            
            if (typeof idOrSettings === 'string') {
                // old, boring deprecated API
                
                settingsOrNil = settingsOrNil || {};
                
                var descriptor = {
                    name: idOrSettings + '_' + Date.now().toString(16) + '.png',
                    contentType: 'image/png',
                    resourceUrl: resourceUrl
                };
                aiq.datasync.createAttachment(idOrSettings, descriptor, settingsOrNil);
            } else {
                // new API, how exciting!
                idOrSettings = idOrSettings || {};
                if (typeof idOrSettings.success === 'function') {
                    idOrSettings.success({
                        contentType: 'image/png',
                        resourceUrl: resourceUrl
                    });
                }
            }

        };
    }
})();

(function() {
    'use strict';

    if (! aiq.messaging) {
        aiq.messaging = {
            _serverOriginatedMessages: [],
            _serverOriginatedAttachments: {},
            _clientOriginatedMessages: [],
            _events: {}
        };

        var triggerEvent = function(event, property, args) {
            if (aiq.messaging._events.hasOwnProperty(event)) {
                var properties = aiq.messaging._events[event];
                if (properties.hasOwnProperty(property)) {
                    properties[property].forEach(function(callback) {
                        callback.apply(undefined, args);
                    });
                }
            }
        };

        // private method
        aiq.messaging._clean = function(callback) {
            aiq.messaging._clientOriginatedMessages = [];
            aiq.messaging._events = {};
            if (typeof callback === 'function') {
                callback();
            }
        };

        // aiq.messaging.getAttachment(id, name, callbacks)
        aiq.messaging.getAttachment = function(id, name, callbacks) {
            callbacks = callbacks || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(callbacks.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(callbacks.failure, 'Invalid name');
            } else if (typeof callbacks.success === 'function') {
                // Let's make sure that the message exists
                aiq.messaging.getMessage(id, {
                    success: function() {
                        var attachments = aiq.messaging._serverOriginatedAttachments[id] || {};
                        var attachment = attachments[name];
                        if (attachment) {
                            callbacks.success({
                                name: name,
                                contentType: attachment.contentType,
                                resourceUrl: attachment.resourceUrl,
                                state: 'available'
                            });
                        } else {
                            aiq._failWithMessage(callbacks.failure, 'Attachment not found');
                        }
                    },
                    failure: callbacks.failure,
                    error: callbacks.error
                });
            }
        };


        // aiq.messaging.getAttachments(id, callbacks)
        aiq.messaging.getAttachments = function(id, callbacks) {
            callbacks = callbacks || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(callbacks.failure, 'Invalid identifier');
            } else if (typeof callbacks.success === 'function') {
                // Let's make sure that the document exists
                aiq.messaging.getMessage(id, {
                    success: function() {
                        var attachments = aiq.messaging._serverOriginatedAttachments[id] || {};
                        var result = Object.keys(attachments).map(function(name) {
                            return {
                                name: name,
                                contentType: attachments[name].contentType,
                                resourceUrl: attachments[name].resourceUrl,
                                state: 'available'
                            };
                        });
                        callbacks.success(result);
                    },
                    failure: callbacks.failure,
                    error: callbacks.error
                });
            }
        };

        // aiq.messaging.getMessages(type, [settings])
        aiq.messaging.getMessages = function(type, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (typeof settings.success === 'function') {
                var messages = [];

                aiq.messaging._serverOriginatedMessages.forEach(function(message) {
                    if (message.type === type) {
                        var copy = aiq._cloneObject(message);
                        copy.relevant = false;
                        messages.push(copy);
                    }
                });

                settings.success(messages);
            }
        };

        // aiq.messaging.getMessage(id, [settings])
        aiq.messaging.getMessage = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                var messageIndex = -1;
                aiq.messaging._serverOriginatedMessages.some(function(message, index) {
                    if (message._id === id) {
                        messageIndex = index;
                        return true;
                    }
                    return false;
                });
                if (messageIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Message not found');
                } else {
                    var copy = aiq._cloneObject(aiq.messaging._serverOriginatedMessages[messageIndex]);
                    copy.relevant = false;
                    settings.success(copy);
                }
            }
        };

        // aiq.messaging.deleteMessage(id, [settings])
        aiq.messaging.deleteMessage = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else {
                var messageIndex = -1;
                aiq.messaging._serverOriginatedMessages.some(function(message, index) {
                    if (message._id === id) {
                        messageIndex = index;
                        return true;
                    }
                    return false;
                });
                if (messageIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Message not found');
                } else {
                    aiq.messaging._serverOriginatedMessages.splice(messageIndex, 1);
                    delete aiq.messaging._serverOriginatedAttachments[id];
                    if (typeof settings.success === 'function') {
                        settings.success();
                    }
                }
            }
        };

        // aiq.messaging.markMessageAsRead(id, [settings])
        aiq.messaging.markMessageAsRead = function(id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else {
                var messageIndex = -1;
                aiq.messaging._serverOriginatedMessages.some(function(message, index) {
                    if (message._id === id) {
                        messageIndex = index;
                        return true;
                    }
                    return false;
                });
                if (messageIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Message not found');
                } else {
                    aiq.messaging._serverOriginatedMessages[messageIndex].read = true;

                    if (typeof settings.success === 'function') {
                        var copy = aiq._cloneObject(aiq.messaging._serverOriginatedMessages[messageIndex]);
                        copy.relevant = false;
                        settings.success(copy);
                    }
                }
            }
        };

        // aiq.messaging.bind(event, settings)
        aiq.messaging.bind = function(event, settings) {
            if (typeof event !== 'string') {
                return;
            }
            if (typeof settings !== 'object') {
                return;
            }
            if (typeof settings.callback !== 'function') {
                return;
            }

            var registerCallback = function(event, property, callback) {
                var properties = aiq.messaging._events[event] || {};
                var callbacks = properties[property] || [];
                callbacks.push(callback);
                properties[property] = callbacks;
                aiq.messaging._events[event] = properties;
            };

            if (['message-received', 'message-updated', 'message-expired'].indexOf(event) !== -1) {
                // SO message event
                if (typeof settings._id === 'string') {
                    registerCallback(event, settings._id, settings.callback);
                    if (typeof settings.type === 'string') {
                        registerCallback(event, settings.type, settings.callback);
                    }
                } else if (['message-queued', 'message-accepted', 'message-rejected', 'message-delivered', 'message-failed'].indexOf(event) !== -1) {
                    // CO message event
                    if (typeof settings.destination !== 'string') {
                        return;
                    }
                    registerCallback(event, settings.destination, settings.callback);
                } else if (['attachment-available', 'attachment-unavailable', 'attachment-failed'].indexOf(event) !== -1) {
                    // SO attachment event
                    if (typeof settings._id !== 'string') {
                        return;
                    }
                    registerCallback(event, settings._id, settings.callback);
                }
            }
        };

        // aiq.messaging.bindMessageEvent(event, typeOrDestination, callback);
        aiq.messaging.bindMessageEvent = function(event, typeOrDestination, callback) {
            console.warn("bindMessageEvent() is deprecated, use bind() instead");
            if (['message-received', 'message-updated', 'message-expired'].indexOf(event) !== -1) {
                aiq.messaging.bind(event, {
                    type: typeOrDestination,
                    callback: callback
                });
            } else {
                aiq.messaging.bind(event, {
                    destination: typeOrDestination,
                    callback: callback
                });
            }
        };

        // aiq.messaging.unbind(callback)
        aiq.messaging.unbind = function(callback) {
            if (typeof callback === 'function') {
                Object.keys(aiq.messaging._events).forEach(function(event) {
                    var properties = aiq.messaging._events[event];
                    Object.keys(properties).forEach(function(property) {
                        var callbacks = properties[property];
                        var index;
                        while ((index = callbacks.indexOf(callback)) !== -1) {
                            callbacks.splice(index, 1);
                        }
                        if (callbacks.length === 0) {
                            delete properties[property];
                        } else {
                            properties[property] = callbacks;
                        }
                    });
                    if (Object.keys(properties).length === 0) {
                        delete aiq.messaging._events[event];
                    } else {
                        aiq.messaging._events[event] = properties;
                    }
                });
            }
        };

        // aiq.messaging.sendMessage(descriptor, [attachments], [callbacks])
        aiq.messaging.sendMessage = function(descriptor, attachmentsOrCallbacks, callbacksOrNull) {
            var attachments;
            var callbacks;
            if (attachmentsOrCallbacks instanceof Array) {
                attachments = attachmentsOrCallbacks;
                callbacks = callbacksOrNull || {};
            } else {
                attachments = [];
                callbacks = attachmentsOrCallbacks;
            }

            if (typeof descriptor !== 'object') {
                aiq._failWithMessage(callbacks.failure, 'Descriptor not specified');
            } else if (! descriptor.hasOwnProperty('payload')) {
                aiq._failWithMessage(callbacks.failure, 'Payload not specified');
            } else if (typeof descriptor.destination !== 'string') {
                aiq._failWithMessage(callbacks.failure, 'Destination not specified');
            } else if ((descriptor.hasOwnProperty('urgent')) && (typeof descriptor.urgent !== 'boolean')) {
                aiq._failWithMessage(callbacks.failure, 'Invalid urgent value');
            } else {
                var isUnique = function(array, property) {
                    var values = {};
                    for (var i = 0; i < array.length; i++) {
                        var value = array[i][property];
                        if (values[value]) {
                            return false;
                        }
                        values[value] = true;
                    }
                    return true;
                };
                var sendMessage = function() {
                    var json = aiq._getMockData('messaging-' + descriptor.destination);
                    var statuses = [{
                        state: 'rejected' // default value when info is not found in the mock file
                    }];
                    if (json) {
                        json.some(function(info) {
                            if ((aiq._doesSourceMatchPattern(descriptor.payload, info.payload)) &&
                                (info.statuses instanceof Array) &&
                                (info.statuses.length !== 0)) {
                                statuses = info.statuses;
                                return true;
                            }
                            return false;
                        });
                    }

                    var message = {
                        _id: Date.now().toString(16) + '_' + aiq.messaging._clientOriginatedMessages.length,
                        destination: descriptor.destination,
                        created: Date.now(),
                        state: 'queued'
                    };
                    aiq.messaging._clientOriginatedMessages.push(message);
                    if (typeof callbacks.success === 'function') {
                        callbacks.success(message);
                    }

                    var status = statuses.shift();
                    var scheduleStatusChange = function(callback) {
                        if (typeof status.delay === 'number') {
                            setTimeout(callback, status.delay);
                        } else {
                            callback();
                        }
                    };
                    var setMessageStatus = function() {
                        message.state = status.state;
                        if ((message.state === 'delivered') || (message.state === 'failed')) {
                            message.body = status.body;
                        }
                        triggerEvent('message-' + message.state, message.destination, [message._id]);
                        if (statuses.length !== 0) {
                            status = statuses.shift();
                            scheduleStatusChange(setMessageStatus);
                        }
                    };
                    scheduleStatusChange(setMessageStatus);
                };
                var testAttachments = function() {
                    if (attachments.length === 0) {
                        sendMessage();
                    } else {
                        var attachment = attachments.shift();
                        if (typeof attachment.name !== 'string') {
                            aiq._failWithMessage(callbacks.failure, 'No attachment name specified');
                        } else if (typeof attachment.contentType !== 'string') {
                            aiq._failWithMessage(callbacks.failure, 'No attachment content type specified');
                        } else if (typeof attachment.resourceUrl !== 'string') {
                            aiq._failWithMessage(callbacks.failure, 'No attachment resource URL specified');
                        } else {
                            aiq._testURL(attachment.resourceUrl, function() {
                                testAttachments();
                            }, function() {
                                aiq._failWithMessage(callbacks.failure, 'Resource not found');
                            });
                        }
                    }
                };

                if (isUnique(attachments, 'name')) {
                    testAttachments();
                } else {
                    aiq._failWithMessage(callbacks.failure, 'Attachment names are not unique');
                }
            }
        };

        // aiq.messaging.getMessageStatus(id, callbacks)
        aiq.messaging.getMessageStatus = function(id, callbacks) {
            callbacks = callbacks || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(callbacks.failure, 'Invalid identifier');
            } else if (typeof callbacks.success === 'function') {
                var found = aiq.messaging._clientOriginatedMessages.some(function(message) {
                    if (message._id === id) {
                        callbacks.success(message);
                        return true;
                    }
                    return false;
                });
                if (! found) {
                    aiq._failWithMessage(callbacks.failure, 'Message not found');
                }
            }
        };

        // aiq.messaging.getMessageStatuses(destination, settings)
        aiq.messaging.getMessageStatuses = function(destination, settings) {
            settings = settings || {};

            if (typeof destination !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid destination');
            } else if (typeof settings.success === 'function') {
                var result = aiq.messaging._clientOriginatedMessages.filter(function(message) {
                    if (((typeof settings.filter !== 'object') ||
                         (aiq._doesSourceMatchPattern(message, settings.filter))) &&
                        (message.destination === destination)) {
                        return message;
                    }
                });
                settings.success(result);
            }
        };

        var json = aiq._getMockData('messaging');
        if (json) {
            var parseMessages = function(root) {
                root.forEach(function(message) {
                    if (typeof message.type === 'string') {
                        aiq.messaging._serverOriginatedMessages.push({
                            _id: message._id || Date.now() + '_' + aiq.messaging._serverOriginatedMessages.length,
                            type: message.type,
                            created: message.created || 0,
                            activeFrom: message.activeFrom || 0,
                            timeToLive: message.timeToLive || 0,
                            urgent: message.urgent || false,
                            read: message.read || false,
                            payload: message.payload
                        });
                    }
                });
            };

            aiq.messaging._serverOriginatedMessages = [];
            if (json.hasOwnProperty('messages')) {
                // new format with attachments
                parseMessages(json.messages);

                if (json.hasOwnProperty('attachments')) {
                    Object.keys(json.attachments).forEach(function(id) {
                        aiq.messaging.getMessage(id, {
                            success: function() {
                                var attachments = json.attachments[id];
                                Object.keys(attachments).forEach(function(name) {
                                    var attachment = attachments[name];
                                    if ((typeof attachment.contentType === 'string') &&
                                        (typeof attachment.path === 'string')) {
                                        var url = 'mock-data/attachments/' + attachment.path;
                                        aiq._testURL(url, function() {
                                            var originalAttachments = aiq.messaging._serverOriginatedAttachments[id] || {};
                                            if (! originalAttachments.hasOwnProperty(name)) {
                                                originalAttachments[name] = {
                                                    contentType: attachment.contentType,
                                                    resourceUrl: url
                                                };
                                                aiq.messaging._serverOriginatedAttachments[id] = originalAttachments;
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            } else {
                // old format
                parseMessages(json);
            }
        }
    }
})();

(function () {
    'use strict';

    if (!aiq.storage) {
        aiq.storage = {
            _documents: [],
            _attachments: []
        };

        // aiq.storage.getDocument(id, [settings])
        aiq.storage.getDocument = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                var document;
                aiq.storage._documents.some(function (doc) {
                    if (doc._id === id) {
                        document = aiq._cloneObject(doc);
                        return true;
                    }
                    return false;
                });
                if (document) {
                    settings.success(document);
                } else {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                }
            }
        };

        // aiq.storage.createDocument(type, fields, [settings])
        aiq.storage.createDocument = function (type, fields, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (!fields || typeof fields !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid fields');
            } else {
                var id = fields._id || Date.now().toString(16) + '_' + aiq.storage._documents.length;
                if (aiq.storage._documents.some(function(doc) { return doc._id === id; })) {
                    aiq._failWithMessage(settings.failure, 'Document already exists');
                    return;
                }
                
                var document = aiq._cloneObject(fields, '^_');
                document._id = id;
                document._type = type;
                aiq.storage._documents.push(document);

                if (typeof settings.success === 'function') {
                    settings.success(document);
                }
            }
        };

        // aiq.storage.updateDocument(id, fields, [settings])
        aiq.storage.updateDocument = function (id, fields, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (!fields || typeof fields !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid fields');
            } else {
                var docIndex = -1;
                aiq.storage._documents.some(function (doc, index) {
                    if (doc._id === id) {
                        docIndex = index;
                        return true;
                    }
                    return false;
                });
                if (docIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                } else {
                    var doc = aiq._cloneObject(fields, '^_');
                    doc._id = id;
                    doc._type = aiq.storage._documents[docIndex]._type;
                    aiq.storage._documents[docIndex] = doc;

                    if (typeof settings.success === 'function') {
                        settings.success(doc);
                    }
                }
            }
        };

        // aiq.storage.deleteDocument(id, [settings])
        aiq.storage.deleteDocument = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else {
                var docIndex = -1;
                aiq.storage._documents.some(function (doc, index) {
                    if (doc._id === id) {
                        docIndex = index;
                        return true;
                    }
                    return false;
                });
                if (docIndex === -1) {
                    aiq._failWithMessage(settings.failure, 'Document not found');
                } else {
                    aiq.storage._documents.splice(docIndex, 1);

                    if (typeof settings.success === 'function') {
                        settings.success();
                    }
                }
            }
        };

        // aiq.storage.getDocuments(type, [settings])
        aiq.storage.getDocuments = function (type, settings) {
            settings = settings || {};

            if (typeof type !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid type');
            } else if (typeof settings.success === 'function') {
                try {
                    var docs = [];
                    aiq.storage._documents.forEach(function (doc) {
                        if (doc._type === type) {
                            if (!settings.filter ||
                                aiq._doesSourceMatchPattern(doc, settings.filter)) {

                                // Document object has to be copied because our spine
                                // model implementation renames _id fields to id.
                                docs.push(aiq._cloneObject(doc));
                            }
                        }
                    });
                    settings.success(docs);
                } catch (error) {
                    aiq._failWithMessage(settings.error, error.message);
                }
            }
        };

        // aiq.storage.getAttachment(id, name, settings)
        aiq.storage.getAttachment = function (id, name, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else if (typeof settings.success === 'function') {
                // Let's make sure that the document exists
                aiq.storage.getDocument(id, {
                    success: function () {
                        var attachments = aiq.storage._attachments[id] || {};
                        var attachment = attachments[name];
                        if (attachment) {
                            settings.success({
                                name: name,
                                contentType: attachment.contentType,
                                resourceUrl: attachment.resourceUrl
                            });
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment not found');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.storage.getAttachments(id, [settings])
        aiq.storage.getAttachments = function (id, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof settings.success === 'function') {
                // Let's make sure that the document exists
                aiq.storage.getDocument(id, {
                    success: function () {
                        var attachments = aiq.storage._attachments[id] || {};
                        var result = Object.keys(attachments).map(function (name) {
                            return {
                                name: name,
                                contentType: attachments[name].contentType,
                                resourceUrl: attachments[name].resourceUrl
                            };
                        });
                        settings.success(result);
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        var storeAttachment = function (id, name, descriptor, callback) {
            var attachments = aiq.storage._attachments[id] || {};
            attachments[name] = {
                contentType: descriptor.contentType,
                resourceUrl: descriptor.resourceUrl
            };
            aiq.storage._attachments[id] = attachments;

            if (typeof callback === 'function') {
                callback({
                    name: name,
                    contentType: descriptor.contentType,
                    resourceUrl: descriptor.resourceUrl
                });
            }
        };

        // aiq.storage.createAttachment(id, descriptor, [settings])
        aiq.storage.createAttachment = function (id, descriptor, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof descriptor !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid descriptor');
            } else if (typeof descriptor.contentType !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid content type');
            } else if (typeof descriptor.resourceUrl !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid resource URL');
            } else {
                aiq.storage.getDocument(id, {
                    success: function () {
                        aiq._testURL(descriptor.resourceUrl, function () {
                            var attachments = aiq.storage._attachments[id] || {};
                            var name = descriptor.name || id + '_' + Object.keys(attachments).length;
                            if (attachments.hasOwnProperty(name)) {
                                aiq._failWithMessage(settings.failure, 'Attachment already exists');
                            } else {
                                storeAttachment(id, name, descriptor, settings.success);
                            }
                        }, function () {
                            aiq._failWithMessage(settings.failure, 'Resource not found');
                        });
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.storage.updateAttachment(id, name, descriptor, [settings])
        aiq.storage.updateAttachment = function (id, name, descriptor, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else if (typeof descriptor !== 'object') {
                aiq._failWithMessage(settings.failure, 'Invalid descriptor');
            } else if (typeof descriptor.contentType !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid content type');
            } else if (typeof descriptor.resourceUrl !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid resource URL');
            } else {
                aiq.storage.getDocument(id, {
                    success: function () {
                        var attachments = aiq.storage._attachments[id] || {};
                        if (attachments.hasOwnProperty(name)) {
                            aiq._testURL(descriptor.resourceUrl, function () {
                                storeAttachment(id, name, descriptor, settings.success);
                            }, function () {
                                aiq._failWithMessage(settings.failure, 'Resource not found');
                            });
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment does not exist');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };

        // aiq.storage.deleteAttachment(id, name, [settings])
        aiq.storage.deleteAttachment = function (id, name, settings) {
            settings = settings || {};

            if (typeof id !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid identifier');
            } else if (typeof name !== 'string') {
                aiq._failWithMessage(settings.failure, 'Invalid name');
            } else {
                // Let's make sure that the document exists
                aiq.storage.getDocument(id, {
                    success: function () {
                        var attachments = aiq.storage._attachments[id] || {};
                        if (attachments.hasOwnProperty(name)) {
                            delete attachments[name];

                            if (typeof settings.success === 'function') {
                                settings.success();
                            }
                        } else {
                            aiq._failWithMessage(settings.failure, 'Attachment not found');
                        }
                    },
                    failure: settings.failure,
                    error: settings.error
                });
            }
        };
    }
})();
