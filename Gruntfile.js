module.exports = function (grunt) {

  require('jit-grunt')(grunt, {
    nodewebkit: 'grunt-node-webkit-builder'
  });
  require('time-grunt')(grunt);

  var mac = process.platform === 'darwin';

  grunt.initConfig({
    clean: {
      build: ['./build/'],
      dist: ['./dist/'],
      pre: ['./dist/client/vendor/', './dist/client/js/', './dist/client/styles/'],
      releases: [
        './build/RequelPro/osx/',
        './build/RequelPro/osx32/',
        './build/RequelPro/osx64/'
      ]
    },

    jshint: {
      client: {
        options: {
          jshintrc: './src/client/.jshintrc'
        },
        src: [
          './src/client/js/**/*.js'
        ]
      },
      server: {
        options: {
          jshintrc: './src/server/.jshintrc',
          ignores: [
            './src/server/node_modules/**/*'
          ]
        },
        src: [
          './src/server/**/*.js'
        ]
      }
    },

    nodewebkit: {
      options: {
        version: '0.11.5',
        build_dir: './build',
        credits: './src/Credits.html',
        osx: false,
        win: false,
        linux32: false,
        linux64: false
      },
      dist: {
        options: {
          osx: true,
          win: true,
          linux32: true,
          linux64: true
        },
        src: ['./dist/**/*']
      },
      snapshot: {
        options: {
          osx: mac,
          win: !mac
        },
        src: ['./dist/**/*']
      },
      dev: {
        options: {
          platforms: ['osx']
        },
        src: ['./dist/**/*']
      }
    },

    copy: {
      dist: {
        expand: true,
        flatten: false,
        cwd: 'src/',
        src: ['**/*', '!**/vendor/', '!**/js/'],
        dest: 'dist/'
      },
      'fonts': {
        expand: true,
        flatten: true,
        cwd: 'src/client/fonts/',
        src: ['**'],
        dest: 'dist/client/fonts/'
      },
      'font-awesome': {
        expand: true,
        flatten: true,
        cwd: 'src/client/vendor/bower_components/font-awesome/fonts/',
        src: ['**'],
        dest: 'dist/client/fonts/'
      }
    },

    sass: {
      dist: {
        files: {
          'dist/client/styles/main.css': 'src/client/styles/requelpro.scss'
        },
        options: {
          includePaths: [
            'src/client/vendor/bower_components/bootstrap-sass-official/assets/stylesheets/',
            'src/client/vendor/bower_components/font-awesome/scss/'
          ]
        }
      }
    },

    ngAnnotate: {
      dist: {
        files: {
          'dist/client/js/app.js': ['dist/client/js/app.js']
        }
      }
    },

    concat: {
      css: {
        src: [
          'src/client/vendor/bower_components/normalize-css/normalize.css',
          'src/client/vendor/bower_components/angular-motion/dist/angular-motion.css',
          'src/client/vendor/bower_components/AngularJS-Toaster/toaster.css',
          'src/client/vendor/bower_components/sweetalert/lib/sweet-alert.css',
          'src/client/vendor/bower_components/bootstrap-additions/dist/bootstrap-additions.css',
          'dist/client/styles/main.css'
        ],
        dest: 'dist/client/styles/main.css'
      },
      app: {
        src: [
          '.tmp/js/templates.js',
          'src/client/js/app.js',
          'src/client/js/mainMenu.js',
          'src/client/js/core/**/*.js',
          'src/client/js/connect/**/*.js',
          'src/client/js/content/**/*.js'
        ],
        dest: 'dist/client/js/app.js'
      },
      plugins: {
        options: {
          separator: ';'
        },
        src: [
          'src/client/vendor/bower_components/jquery/dist/jquery.js',
          'src/client/vendor/bower_components/angular/angular.js',
          'src/client/vendor/bower_components/angular-ui-router/release/angular-ui-router.js',
          'src/client/vendor/bower_components/angular-animate/angular-animate.js',
          'src/client/vendor/bower_components/angular-sanitize/angular-sanitize.js',
          'src/client/vendor/bower_components/angular-strap/dist/angular-strap.js',
          'src/client/vendor/bower_components/angular-strap/dist/angular-strap.tpl.js',
          'src/client/vendor/bower_components/AngularJS-Toaster/toaster.js',
          'src/client/vendor/bower_components/sweetalert/lib/sweet-alert.js',
          'src/client/vendor/bower_components/js-data/dist/js-data.js',
          'src/client/vendor/bower_components/js-data-angular/dist/js-data-angular.js',
          'src/client/vendor/bower_components/angular-cache/dist/angular-cache.js'
        ],
        dest: 'dist/client/js/plugins.js'
      }
    },

    uglify: {
      dist: {
        files: [
          {
            expand: true,
            cwd: './dist',
            src: ['**/*.js', '!node_modules/**/*'],
            dest: './dist'
          }
        ]
      }
    },

    html2js: {
      app: {
        options: {
          base: 'src/client/js/'
        },
        src: ['src/client/js/**/*.html'],
        dest: '.tmp/js/templates.js'
      }
    },

    shell: {
      open_mac: {
        command: 'open ./build/RequelPro/osx/RequelPro.app'
      },
      open_win: {
        command: '"build/releases/RequelPro/win/RequelPro/RequelPro.exe" &'
      },
      close_mac: {
        command: 'ps -ef | grep build/RequelPro/osx/RequelPro.app/Contents/MacOS/node-webkit | grep -v grep | awk \'{print $2}\' | xargs kill -9'
      }
    }
  });

  grunt.registerTask('prebuild', [
    'jshint',
    'clean:dist',
    'copy',
    'clean:pre',
    'html2js',
    'sass',
    'concat',
    'ngAnnotate'
  ]);

  var buildTasks = [
    'prebuild',
    'clean:releases',
    'nodewebkit:dev'
  ];

  if (process.platform === 'darwin') {
    buildTasks.unshift('shell:close_mac');
    buildTasks.push('shell:open_mac');
  } else {
    buildTasks.push('shell:open_win');
  }

  grunt.registerTask('build', buildTasks);

  grunt.registerTask('snapshot', [
    'prebuild',
    'clean:releases',
    'nodewebkit:snapshot'
  ]);

  grunt.registerTask('dist', [
    'prebuild',
    'clean:releases',
    //'uglify',
    'nodewebkit:dist'
  ]);

  grunt.registerTask('o', ['shell:open_mac']);
  grunt.registerTask('c', ['shell:close_mac']);

  grunt.registerTask('default', [
    'build'
  ]);
};
