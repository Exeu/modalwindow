/**
 * jQuery Plugin implementation.
 *
 * @package ModalWindow
 * @author Lars Parick Hess <larshess@gmail.com>
 */
(function() {
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
	 * @return {jQuery} | ModalWindow
	 */
	$.fn.modalwindow = function(options) {
		console.log('$.fn.modalwindow called on ' + this.length + ' element(s)');

		options = $.extend(true, {}, $.modalwindow.options.modalWindow, {
			pluginNamespace: $.modalwindow.options.pluginNamespace
		}, options);

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

		this.each(function() {
			var $this = $(this),
			    selector = this.selector || '',
			    modalWindowInstance = null,
			    instanceOptions = options || {};

				if ($.isPlainObject($this.data(options.pluginNamespace))) {
					$.extend(true, instanceOptions, $this.data(options.pluginNamespace));
				}

			if ((modalWindowInstance = $this.data(instanceOptions.pluginNamespace + '-instance')) == null) {
				var identifier = instanceOptions.identifier || instanceOptions.pluginNamespace + '_' + (modalWindowCounter++);
				if (identifier === '__current') {
					if (modalWindowManagerInstance.current()) {
						identifier = modalWindowManagerInstance.current().getIdentifier();
					} else {
						identifier = instanceOptions.pluginNamespace + '_' + (modalWindowCounter++);
					}
				}

				modalWindowInstance = $.modalwindow(identifier);
				$this.data(instanceOptions.pluginNamespace + '-instance', modalWindowInstance);
			}

			$this
				.unbind('open.' + instanceOptions.pluginNamespace)
				.bind('open.' + instanceOptions.pluginNamespace, function(event) {
					event.stopPropagation();
					run(event, $(this), instanceOptions);
				});

			$this.unbind('click.' + instanceOptions.pluginNamespace);
			if (selector || instanceOptions.initializeWithClickEvent) {
				$this.bind('click.' + instanceOptions.pluginNamespace, function(event) {
					event.preventDefault();
					$(event.target).trigger('open.' + instanceOptions.pluginNamespace);
				});
			}
		});

		return this;
	};

	var modalWindowManagerInstance = new ModalWindowManager($.extend({}, $.modalwindow.options.windowManager, {
	    	pluginNamespace: $.modalwindow.options.pluginNamespace
	    })),
	    overlayInstance = new Overlay($.extend({}, $.modalwindow.options.overlay, {
	    	pluginNamespace: $.modalwindow.options.pluginNamespace
	    })),
	    modalWindowCounter = 0;
})();
