(function (w) {

    function getDateFormatted (timestamp, timeOnly) {
        var d = new Date(timestamp),
            time = [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
        return timeOnly ? time : [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-') + ' ' + time;
    }

    function Controller (elements) {
        this.$ = elements;
        this._prevType = '';
        this._bindingsById = [];
        this._msgElements = {};

        // Force context for callbacks
        this._onMsgReceivedOrUpdated = this._onMsgReceivedOrUpdated.bind(this);
        this._onMsgExpired = this._onMsgExpired.bind(this);
    }

    Controller.prototype.initHandlers = function () {
        this.$.form.addEventListener('submit', this._onSubmit.bind(this), false);
        this.$.typeField.addEventListener('input', this._onChange.bind(this), false);
    };

    Controller.prototype._onSubmit = function (e) {
        var that = this,
            type = this.$.typeField.value;

        e.preventDefault();

        if (this._prevType) {
            this.cleanup();
        }

        // Request all existent Messages
        aiq.messaging.getMessages(type, {
            success: function (messages) {
                messages.forEach(that.renderMsg, that);
            },
            error: alert,
            fail: alert
        });

        // Listen for any changes
        aiq.messaging.bind('message-received', {type: type, callback: this._onMsgReceivedOrUpdated});
        aiq.messaging.bind('message-updated', {type: type, callback: this._onMsgReceivedOrUpdated});
        aiq.messaging.bind('message-expired', {type: type, callback: this._onMsgExpired});

        this._prevType = type;
    };

    Controller.prototype.cleanup = function () {
        // Remove global listeners
        aiq.messaging.unbind('message-received', {type: this._prevType});
        aiq.messaging.unbind('message-updated', {type: this._prevType});
        aiq.messaging.unbind('message-expired', {type: this._prevType});

        // Remove ID specific listeners
        this._bindingsById.forEach(function (id) {
            aiq.messaging.unbind('message-expired', {_id: id});
            aiq.messaging.unbind('message-updated', {_id: id});
        });

        // Cleanup the DOM
        this.$.msgList.innerHTML = '';

        this._msgElements = {};

        this._prevType = '';
        this._bindingsById = [];

        this.refreshMsgNumLabel();
    };

    Controller.prototype.deleteMsgById = function (id) {
        if (this._msgElements[id]) {

            // Remove ID specific bindings
            var cbIdx = this._bindingsById.indexOf(id);
            if (cbIdx !== -1) {
                aiq.messaging.unbind('message-expired', {_id: id});
                aiq.messaging.unbind('message-updated', {_id: id});

                // Remove the reference
                this._bindingsById.splice(cbIdx, 1);
            }

            // Remove the Element from a DOM
            this._msgElements[id].remove();

            // Remove reference to the Element
            delete this._msgElements[id];
        }
    };

    Controller.prototype.refreshMsgNumLabel = function () {
        this.$.msgNum.innerText = Object.keys(this._msgElements).length;
    };

    Controller.prototype.renderMsg = function (data) {
        var that = this,
            $template = this._msgElements[data._id],
            isNew = !$template;

        if (!$template) {
            isNew = true;
            $template = this.$.msgTemplate.cloneNode(true);
        }

        $template.querySelector('.time').innerText = getDateFormatted(data.created, true);
        $template.querySelector('.title').innerText = data.payload.title;

        // Details
        $template.querySelector('.id').innerText = data._id;
        $template.querySelector('.type').innerText = data.type;
        $template.querySelector('.description').innerText = data.payload.description;

        // Dates
        $template.querySelector('.created').innerText = getDateFormatted(data.created);

        if (data.timeToLive) {
            $template.querySelector('.expiry').innerText =
                getDateFormatted((data.activeFrom || data.created) + data.timeToLive * 1000);
        }

        function markElementAsRead () {
            $template.classList.add('read');
            $markAsReadBtn.disabled = true;
        }

        // Bind event only if this is a new Element
        if (isNew) {
            $template.addEventListener('click', function () {
                // Collapse all expanded elements
                [].forEach.call(that.$.msgList.querySelectorAll('.expanded'), function (el) {
                    // Ignore current element
                    if (this !== el) {
                        el.classList.remove('expanded');
                    }
                }, this);
                this.classList.toggle('expanded');
            });

            var $markAsReadBtn = $template.querySelector('.js-mark-as-read');
            if (data.read) {
                markElementAsRead();
            } else {
                $markAsReadBtn.addEventListener('click', function (e) {
                    // Prevent Element's collapsing in case of Button click
                    e.stopPropagation();
                    aiq.messaging.markMessageAsRead(data._id, {
                        success: markElementAsRead,
                        error: alert,
                        fail: alert
                    });
                });
            }

            $template.querySelector('.js-delete').addEventListener('click', function (e) {
                // Prevent Element's collapsing in case of Button click
                e.stopPropagation();
                aiq.messaging.deleteMessage(data._id, {
                    success: function() {
                        that.deleteMsgById(data._id);
                        that.refreshMsgNumLabel();
                    },
                    error: alert,
                    fail: alert
                });
            });

            $template.querySelector('.js-bind-events').addEventListener('click', function (e) {
                // Prevent Element's collapsing in case of Button click
                e.stopPropagation();

                aiq.messaging.bind('message-expired', {_id: data._id, callback: function (id) {
                    alert('Message "' + id + '" is expired now.');
                }});
                aiq.messaging.bind('message-updated', {_id: data._id, callback: function (id) {
                    alert('Message "' + id + '" was updated.');
                }});

                // Keep track of ID specific bindings
                that._bindingsById.push(data._id);

                // Prevent redundant bindings
                this.disabled = true;
            });

            // Keep back reference to the DOM Element
            this._msgElements[data._id] = $template;

            this.$.msgList.appendChild($template);

            this.refreshMsgNumLabel();
        }
    };

    Controller.prototype._onChange = function (e) {
        this.$.fetchButton.disabled = !e.target.value.trim();
    };

    Controller.prototype._onMsgExpired = function (id) {
        this.deleteMsgById(id);
        this.refreshMsgNumLabel();
    };

    Controller.prototype._onMsgReceivedOrUpdated = function (id) {
        aiq.messaging.getMessage(id, {
            success: this.renderMsg.bind(this),
            error: alert,
            fail: alert
        });
    };

    w.Controller = Controller;
})(window);
