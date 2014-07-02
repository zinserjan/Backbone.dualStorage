module.exports = (grunt) ->
  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-watch')

  grunt.initConfig
    watch:
      coffee:
        files: 'backbone.dualstorage.coffee'
        tasks: ['build']
    coffee:
      compile:
        files:
          'backbone.dualstorage.js': 'backbone.dualstorage.coffee'
      compileAmd:
        options:
          bare: true
        files:
          'spec/backbone.dualstorage.js': 'backbone.dualstorage.coffee'

    concat:
      options:
        separator: ''
      dist:
        src: ['amd.header', 'spec/backbone.dualstorage.js', 'amd.footer']
        dest: 'backbone.dualstorage.amd.js'

  grunt.loadNpmTasks 'grunt-contrib-concat'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-coffee'

  grunt.registerTask 'build', ['coffee:compile', 'coffee:compileAmd', 'concat']
