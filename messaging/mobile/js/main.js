(function (w) {

    function getDateFormatted (timestamp, timeOnly) {
        var d = new Date(timestamp),
            time = [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
        return timeOnly ? time : [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-') + ' ' + time;
    }

    function Controller (elements) {
        this.$ = elements;
        this._prevType = '';
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

        //FIXME: remove bindings by id
        if (this._prevType) {
            this.cleanup();
        }

        aiq.messaging.getMessages(type, {
            success: function (messages) {
                messages.forEach(that.renderMsg, that);
            },
            error: alert,
            fail: alert
        });
        aiq.messaging.bind('message-received', {type: type, callback: this._onMsgReceivedOrUpdated});
        aiq.messaging.bind('message-updated', {type: type, callback: this._onMsgReceivedOrUpdated});
        aiq.messaging.bind('message-expired', {type: type, callback: this._onMsgExpired});

        this._prevType = type;
    };

    Controller.prototype.cleanup = function () {
        aiq.messaging.unbind(this._onMsgReceivedOrUpdated);
        aiq.messaging.unbind(this._onMsgExpired);

        // Cleanup the DOM
        this.$.msgList.innerHTML = '';

        this._msgElements = {};

        this.refreshMsgNumLabel();
    };

    //FIXME: remove bindings by ID
    Controller.prototype.deleteMsgById = function (id) {
        if (this._msgElements[id]) {
            this._msgElements[id].remove();
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
                $template.classList.add('read');
                $markAsReadBtn.disabled = true;
            } else {
                $markAsReadBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    aiq.messaging.markMessageAsRead(data._id, {
                        success: function () {
                            $template.classList.add('read');
                            $markAsReadBtn.disabled = true;
                        },
                        error: alert,
                        fail: alert
                    });
                });
            }

            $template.querySelector('.js-delete').addEventListener('click', function (e) {
                e.stopPropagation();
                aiq.messaging.deleteMessage(data._id, {
                    success: that.deleteMsgById.bind(that),
                    error: alert,
                    fail: alert
                });
            });

            $template.querySelector('.js-bind-events').addEventListener('click', function (e) {
                e.stopPropagation();
                aiq.messaging.bind('message-expired', {_id: data._id, callback: function (id) {
                    alert('Message "' + id + '" is expired now.');
                }});
                aiq.messaging.bind('message-updated', {_id: data._id, callback: function (id) {
                    alert('Message "' + id + '" was updated.');
                }});
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
            error: falert,
            fail: alert
        });
    };

    w.Controller = Controller;
})(window);
