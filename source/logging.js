(function(console) {
	var method, methods = ('assert,count,debug,dir,dirxml,error,exception,group,' +
		'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
		'time,timeEnd,trace,warn').split(',');
	while ((method = methods.pop()) !== undefined) {
		console[method] = console[method] || $.noop;
	}
})(console = window.console || {});
