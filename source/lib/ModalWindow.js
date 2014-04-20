/**
 * ModalWindow object for rendering a window.
 *
 * @package ModalWindow
 * @author Lars Parick Hess <larshess@gmail.com>
 */

/**
 * @constructor
 */
var ModalWindow = function(identifier) {
	var self = this;

	this._options = null;
	this._domElement = null;
	this._innerDomElement = null;
	this._lockDomElement = null;

	this._isOpen = false;
	this._isActive = true;
	this._contentIsLoaded = false;

	this.getIdentifier = function() { return identifier; };
};

/**
 *
 * @private
 */
ModalWindow.prototype._initialize = function() {
	this._domElement = $(
		'<div class="modalwindow-wrap" tabIndex="-1">' +
			'<div class="modalwindow-skin"><div class="modalwindow-outer">' +
			'<div class="modalwindow-inner"></div>' +
			'<div class="modalwindow-windowlock"></div></div></div>' +
		'</div>'
	).appendTo('.modalwindow-overlay');

	this._innerDomElement = this._domElement.find('.modalwindow-inner');
	this._lockDomElement = this._domElement.find('.modalwindow-windowlock');
};

/**
 *
 * @private
 */
ModalWindow.prototype._sizeWindow = function() {
	if (!this._isOpen) {
		return;
	}

	this._domElement
		.height(this._options.height)
		.width(this._options.width);

	this._innerDomElement
		.height(this._options.height)
		.width(this._options.width);
};

/**
 *
 * @param {$.Event} event
 * @private
 */
ModalWindow.prototype._repositionWindow = function(event) {
	if (!this._isOpen) {
		return;
	}

	this._domElement.css({
		'top':  Math.max(0, (($window.height() - this._domElement.outerHeight()) / 2) + $window.scrollTop()) + 'px',
		'left': Math.max(0, (($window.width() - this._domElement.outerWidth()) / 2) + $window.scrollLeft()) + 'px'
	});
};

/**
 *
 * @param {object} options
 */
ModalWindow.prototype.open = function(options) {
	console.log('ModalWindow', this.getIdentifier(), 'open');

	this._options = options;
	this._isOpen = true;

	$document
		.bind('show-window.' + this.getIdentifier(), $.proxy(this._showWindowCallback, this))
		.trigger('show-overlay.' + this._options.pluginNamespace);

	this._showWindow();
};

/**
 *
 */
ModalWindow.prototype.close = function() {
	if (!this._isOpen || !this._isActive) {
		return;
	}
	console.log('ModalWindow', this.getIdentifier(), 'close');

	$document
		.trigger('unload-window.' + this.getIdentifier())
		.unbind('close-window.' + this.getIdentifier())
		.unbind('reposition-window.' + this.getIdentifier());

	this._domElement
		.hide()
		.removeClass('modalwindow-opened');
	this._innerDomElement.children().remove();

	$document
		.trigger({
			type: 'window-closed.' + this._options.pluginNamespace,
			windowIdentifier: this.getIdentifier()
		});

	this._isOpen = false;
};

/**
 *
 * @private
 */
ModalWindow.prototype._showWindow = function() {
	$document
		.unbind('show-window.' + this.getIdentifier())
		.trigger({
			type:             'window-opened.' + this._options.pluginNamespace,
			windowIdentifier: this.getIdentifier()
		})
		.bind('reposition-window.' + this._options.pluginNamespace, $.proxy(function(event) {
			event.stopPropagation();
			this._repositionWindow();
		}, this))
		.bind('close-window.' + this.getIdentifier(), $.proxy(this.close, close));

	if (this._domElement == null) {
		this._initialize();
	}

	this._sizeWindow();
	this._repositionWindow();

	this._domElement
		.addClass('modalwindow-opened')
		.show();

	this._loadContent();
};

/**
 *
 */
ModalWindow.prototype.activate = function() {
	if (this._isActive) {
		return;
	}
	console.log('ModalWindow', this.getIdentifier(), 'activate');

	this._isActive = true;

	this._domElement.removeClass('modalwindow-deactivated');
};

/**
 *
 */
ModalWindow.prototype.deactivate = function() {
	if (!this._isActive) {
		return;
	}
	console.log('ModalWindow', this.getIdentifier(), 'deactivate');

	this._isActive = false;

	this._lockDomElement
		.height(this._innerDomElement.outerHeight())
		.width(this._innerDomElement.outerWidth());

	this._domElement.addClass('modalwindow-deactivated');
};

/**
 *
 * @returns {boolean}
 */
ModalWindow.prototype.isOpen = function() {
	return this._isOpen;
};

/**
 *
 * @returns {boolean}
 */
ModalWindow.prototype.isActive = function() {
	return this._isActive;
};

/**
 *
 * @private
 */
ModalWindow.prototype._loadContent = function() {
	if (this._contentIsLoaded) {
		return;
	}

	var self = this;

	this.deactivate();
	$document.trigger('show-loading.' + this._options.pluginNamespace);

	this._innerDomElement.children().remove();

	$.ajax({
		url: this._options.typeOptions.href
	})
		.done(function(data, textStatus, jqXHR) {
			self._innerDomElement.html(data);
			$document.trigger('hide-loading.' + self._options.pluginNamespace);
			self.activate();
		});
};
