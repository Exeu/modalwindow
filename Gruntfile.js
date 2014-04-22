module.exports = function(grunt) {
	"use strict";

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: [ 'dist/*' ],
		jsvalidate: {
			options:{
				globals: {},
				esprimaOptions: {},
				verbose: false
			},
			targetName:{
				files:{
					src: [ '<%= jshint.files %>' ]
				}
			}
		},
		jshint: {
			files: [ 'source/**/*.js' ],
			options: {
				eqeqeq: true,
				eqnull: true,
				globals: {
					jQuery: true,
					console: true,
					module: true,
					document: true
				}
			}
		},
		concat: {
			options: {
				separator: '\n\n',
				banner: ';(function(window, document, $, undefined) {\n\t"use strict;"\n',
				footer: '\n})(window, document, jQuery);'
			},
			dist: {
				src: [ 'source/bootstrap.js', 'source/lib/*.js', 'source/jquery-plugin.js' ],
				dest: 'dist/jquery.<%= pkg.name %>.js'
			}
		},
		removelogging: {
			dist: {
				src: '<%= concat.dist.dest %>',
				dest: 'dist/jquery.<%= pkg.name %>.clean.js',
				options: {
				}
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			dist: {
				files: {
					'dist/jquery.<%= pkg.name %>.min.js': ['<%= removelogging.dist.dest %>']
				}
			}
		},
		watch: {
			files: [ '<%= concat.dist.src %>' ],
			tasks: [ 'dev:*' ]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-jsvalidate');
	grunt.loadNpmTasks('grunt-remove-logging');


	grunt.registerTask('dev', [ 'clean', 'jsvalidate', 'jshint', 'concat' ]);
	grunt.registerTask('default', [ 'dev:*', 'removelogging', 'uglify']);
};
