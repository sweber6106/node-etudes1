'use strict';
    
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      file: ['Gruntfile.js', 'app.js'],
      options: {
        jshintrc: true
      }
    },
  });
    
  grunt.loadNpmTasks('grunt-contrib-jshint');

        
  grunt.registerTask('default', ['jshint']);

  grunt.registerTask('lint', ['jshint']);
};
