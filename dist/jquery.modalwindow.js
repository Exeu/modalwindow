;(function(window, document, $, undefined) {
	"use strict;"
/**
 * Bootstrap.
 *
 * @package ModalWindow
 * @author Lars Parick Hess <larshess@gmail.com>
 */

var $html = $('html'),
	$window = $(window),
	$document = $(document),

	overlayInstance = null;


(function(console) {
	var method, methods = ('assert,count,debug,dir,dirxml,error,exception,group,' +
		'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
		'time,timeEnd,trace,warn').split(',');
	while ((method = methods.pop()) !== undefined) {
		console[method] = console[method] || $.noop;
	}
})(console = window.console || {});


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


/**
 * ModalWindowManager object for managing multiple overlay-window instances.
 *
 * @package ModalWindow
 * @author Lars Parick Hess <larshess@gmail.com>
 */

/**
 * ModalWindowManager object.
 *
 * @param {object} options
 * @constructor
 */
var ModalWindowManager = function(options) {
	var self = this;

	this._options = options;
	this._collection = {};
	this._orderedCollection = [];

	this._orderedCollection.remove = function(from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	};

	$window
		.bind('resize.' + this._options.pluginNamespace, function(event) {
			$document.trigger('reposition-window.' + self._options.pluginNamespace);
		});

	$document
		.bind('window-close.' + this._options.pluginNamespace, function(event) {
			event.stopPropagation();
			if (self.current() != null) {
				self.current.close();
			}
		})
		.bind('window-opened.' + this._options.pluginNamespace, function(event) {
			event.stopPropagation();
			self._windowOpenedCallback(event.windowIdentifier);
		})
		.bind('window-closed.' + this._options.pluginNamespace, function(event) {
			event.stopPropagation();
			self._windowClosedCallback(event.windowIdentifier);
		});
};

/**
 *
 * @param {string} identifier
 * @private
 */
ModalWindowManager.prototype._windowOpenedCallback = function(identifier) {
	if (identifier == null || !this.has(identifier)) {
		return;
	}

	if (this.current() && this.current() !== this.get(identifier)) {
		this.current().deactivate();
	}

	this._moveToTop(identifier);
};

/**
 *
 * @param {string} identifier
 * @private
 */
ModalWindowManager.prototype._windowClosedCallback = function(identifier) {
	if (identifier == null || !this.has(identifier)) {
		return;
	}

	var wasCurrent = this.get(identifier) === this.current(),
	    i, instance, prevInstanceFound = false;

	// get next open and inactive window instance from stack
	for (i = (this._orderedCollection.length - 2); i >= 0; i--) {
		instance = this._collection[this._orderedCollection[i]];
		if (instance.isOpen() && !instance.isActive()) {
			this._moveToTop(this._orderedCollection[i]);
			prevInstanceFound = true;
			break;
		}
	}

	if (prevInstanceFound && wasCurrent && this.current() !== undefined) {
		this.current().activate();
	} else {
		$document.trigger('hide-overlay.' + this._options.pluginNamespace);
	}
};

/**
 *
 * @param {string} identifier
 * @private
 */
ModalWindowManager.prototype._moveToTop = function(identifier) {
	if (!this.has(identifier)) {
		throw "Invalid identifier given";
	}

	var key = this._orderedCollection.indexOf(identifier);
	if (key > -1) {
		this._orderedCollection.remove(key);
		this._orderedCollection.push(identifier);
	}
};

/**
 *
 * @returns {ModalWindow}
 */
ModalWindowManager.prototype.current = function() {
	if (this.size() > 0) {
		var instance = this._collection[
			this._orderedCollection[this._orderedCollection.length - 1]
		];
		if (instance.isOpen()) {
			return instance;
		}
	}

	return undefined;
};

/**
 *
 * @returns {number}
 */
ModalWindowManager.prototype.size = function() {
	return this._orderedCollection.length;
};

/**
 *
 * @param {string} identifier
 * @returns {boolean}
 */
ModalWindowManager.prototype.has = function(identifier) {
	return this._collection[identifier] !== undefined;
};

/**
 * @param {string} identifier
 * @returns {ModalWindow}
 */
ModalWindowManager.prototype.get = function(identifier) {
	if (this.has(identifier)) {
		return this._collection[identifier];
	}

	return undefined;
};

/**
 *
 * @param {string} identifier
 * @param {ModalWindow} windowInstance
 * @return {number}
 */
ModalWindowManager.prototype.add = function(identifier, windowInstance) {
	this._collection[identifier] = windowInstance;
	this._orderedCollection.unshift(identifier);

	return this.size();
};

/**
 *
 * @param {string} identifier
 * @return {number}
 */
ModalWindowManager.prototype.remove = function(identifier) {
	if (!this.has(identifier))
		return undefined;

	delete this._collection[identifier];

	var key =  this._orderedCollection.indexOf(identifier);
	if (key > -1) {
		this._orderedCollection.remove(key);
	}

	return this.size();
};


/**
 * Overlay object for rendering a fullpage overlay.
 *
 * @package ModalWindow
 * @author Lars Parick Hess <larshess@gmail.com>
 */

/**
 *
 * @param {object} options
 * @constructor
 */
var Overlay = function(options) {
	this._domElement = null;
	this._options = options || {};

	$document
		.bind('show-overlay.' + this._options.pluginNamespace, $.proxy(this._showOverlayCallback, this))
		.bind('hide-overlay.' + this._options.pluginNamespace, $.proxy(this.hide, this))
		.bind('show-loading.' + this._options.pluginNamespace, $.proxy(this.showLoading, this))
		.bind('hide-loading.' + this._options.pluginNamespace, $.proxy(this.hideLoading, this));
};

/**
 *
 * @private
 */
Overlay.prototype._initialize = function() {
	this._domElement = $(
		'<div class="modalwindow-overlay modalwindow-overlay-fixed" style="display:none;"></div>'
	).appendTo(document.body);
};

/**
 *
 * @param {$.Event} event
 * @private
 */
Overlay.prototype._showOverlayCallback = function(event) {
	this.show();
};

/**
 *
 */
Overlay.prototype.showLoading = function() {
	if ($('> .modalwindow-loading').size() !== 1) {
		$('<div id="modalwindow-loading"><div></div></div>').appendTo('body');
	}
};

/**
 *
 */
Overlay.prototype.hideLoading = function() {
	$('#modalwindow-loading').remove();
};

/**
 *
 */
Overlay.prototype.show = function() {
	if (!this.isVisible()) {
		console.log('Overlay.prototype.show show overlay');

		if (this._domElement == null) {
			this._initialize();
		}

		$html.addClass('modalwindow-lock');
		this._domElement.show();
	}
};

/**
 *
 */
Overlay.prototype.hide = function() {
	if (this.isVisible()) {
		console.log('Overlay.prototype.show hide overlay');

		$html.removeClass('modalwindow-lock');
		this._domElement.hide();
	}
};

/**
 *
 * @return {boolean}
 */
Overlay.prototype.isVisible = function() {
	return this._domElement != null && this._domElement.is(':visible');
};


/**
 * jQuery Plugin implementation.
 *
 * @package ModalWindow
 * @author Lars Parick Hess <larshess@gmail.com>
 */
(function() {
	/**
	 * @param {string} identifier
	 * @returns {ModalWindow}
	 */
	$.modalwindow = function(identifier) {
		var modalWindowInstance = null;

		if (identifier == null) {
			modalWindowInstance = modalWindowManagerInstance.current();
		} else {
			modalWindowInstance = modalWindowManagerInstance.get(identifier);
		}

		if (modalWindowInstance === undefined) {
			console.log('$.modalwindow initializes identifier "' + identifier + '"');

			modalWindowInstance = new ModalWindow(identifier);
			modalWindowManagerInstance.add(identifier, modalWindowInstance);
		}

		return modalWindowInstance;
	};

	/**
	 * Default options.
	 */
	$.modalwindow.options = {
		pluginNamespace: 'modalwindow',
		identifier: null,
		windowManager: {
		},
		overlay: {
		},
		modalWindow: {
			initializeWithClickEvent: true,
			width:  800,
			height: 400
		}
	};

	/**
	 * jQuery PlugIn "modalwindow".
	 *
	 * @param {object} options
	 * @return {jQuery}
	 */
	$.fn.modalwindow = function(options) {
		console.log('$.fn.modalwindow called on ' + this.length + ' element(s)');

		options = $.extend(true, {}, $.modalwindow.options.modalWindow, {
			pluginNamespace: $.modalwindow.options.pluginNamespace
		}, options);

		this.each(function() {
			var $this = $(this),
			    selector = this.selector || '',
			    modalWindowInstance = null,
			    instanceOptions = $.extend(true, {}, options, $this.data(options.pluginNamespace) || {});

			if (!(modalWindowInstance = $this.data(instanceOptions.pluginNamespace + '-instance'))) {
				var identifier = instanceOptions.identifier;
				if (!identifier) {
					identifier = instanceOptions.pluginNamespace + '_' + (modalWindowCounter++);
				} else if (identifier === '__current' && modalWindowManagerInstance.current()) {
					identifier = modalWindowManagerInstance.current().getIdentifier();
				}

				$this.data(instanceOptions.pluginNamespace + '-instance', $.modalwindow(identifier));
			}

			$this
				.unbind('open.' + instanceOptions.pluginNamespace)
				.unbind('click.' + instanceOptions.pluginNamespace)
				.bind('open.' + instanceOptions.pluginNamespace, function(event) {
					event.stopPropagation();
					run(event, $(this), instanceOptions);
				});

			if (selector || instanceOptions.initializeWithClickEvent) {
				$this.bind('click.' + instanceOptions.pluginNamespace, function(event) {
					event.preventDefault();
					$(event.target).trigger('open.' + instanceOptions.pluginNamespace);
				});
			}
		});

		return this;
	};

	/**
	 * Starts the rendering process of an modal-window instance.
	 *
	 * @param {$.Event} event
	 * @param {object} instanceOptions
	 *
	 * @return void
	 */
	var run = function(event, $base, instanceOptions) {
		$base.blur();
		if (!(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) && !$base.is('.modalwindow-window-wrap')) {
			console.log('$.fn.modalwindow::run', $base);

			instanceOptions.type = 'ajax';
			instanceOptions.typeOptions = {
				href: $base.attr('href')
			};

			$base
				.data(instanceOptions.pluginNamespace + '-instance')
				.open(instanceOptions);
		}
	};

	var modalWindowManagerInstance = new ModalWindowManager($.extend({}, $.modalwindow.options.windowManager, {
	    	pluginNamespace: $.modalwindow.options.pluginNamespace
	    })),
	    overlayInstance = new Overlay($.extend({}, $.modalwindow.options.overlay, {
	    	pluginNamespace: $.modalwindow.options.pluginNamespace
	    })),
	    modalWindowCounter = 0;
})();

})(window, document, jQuery);