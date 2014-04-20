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
