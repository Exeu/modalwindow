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
