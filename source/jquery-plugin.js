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
			    instanceOptions = $.extend(true, {}, options, $this.data(options.pluginNamespace) || {});

			if (!$.data(this, instanceOptions.pluginNamespace + '-instance')) {
				var identifier = instanceOptions.identifier;
				if (!identifier) {
					identifier = instanceOptions.pluginNamespace + '_' + (modalWindowCounter++);
				} else if (identifier === '__current' && modalWindowManagerInstance.current()) {
					identifier = modalWindowManagerInstance.current().getIdentifier();
				}

				$.data(this, instanceOptions.pluginNamespace + '-instance', $.modalwindow(identifier));
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
