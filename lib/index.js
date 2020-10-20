// 实现这个项目的构建任务

const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const bs = browserSync.create()
const cwd = process.cwd()
let config = {
  // default config
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**'
    }
  }
} 

try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (e) {}


const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const style = () => {
  // 通过src的选项参数base来确定转换过后的基准路径
  return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.sass({ outputStyle: 'expanded' })) // 完全展开构建后的代码
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream:true }))
}

 const script = () => {
  return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
     // 只是去唤醒babel/core这个模块当中的转换过程
     // babel作为一个平台不做任何事情，只是提供一个环境
     // presets 就是插件的集合
    .pipe(plugins.babel({ presets: [require('@babel/preset-env')] }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream:true }))
}

const page = () => {
  return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } }))  // 编译html，并将数据对象中的变量注入模板，不缓存
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream:true }))
}

const image = () => {
  return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const font = () => {
  return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', { base: config.build.public, cwd: config.build.public })
    .pipe(dest(config.build.dist))
}

const serve = () => {
  watch(config.build.paths.styles, { cwd: config.build.src }, style)
  watch(config.build.paths.scripts, { cwd: config.build.src }, script)
  watch(config.build.paths.pages, { cwd: config.build.src }, page)
  // watch('src/assets/images/**', image)
  // watch('src/assets/fonts/**', font)
  // watch('public/**', extra)
  watch([
    config.build.paths.images,
    config.build.paths.fonts,
  ], { cwd: config.build.src }, bs.reload)

  watch('**', { cwd: config.build.public }, bs.reload)

  bs.init({
    notify: false, // 是否提示
    port: 2080, // 端口
    open: true, // 自动打开页面 默认true
    // files: 'temp/**', // 启动后自动监听的文件
    server: { 
      baseDir: [config.build.temp, config.build.dist, config.build.public],
      routes: { // 优先于baseDir
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp, cwd: config.build.temp})
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))  // dist->temp
    // html js css三种流
    // 压缩js文件
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    // 压缩css文件
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // 压缩html文件
    .pipe(
      plugins.if(/\.html$/,plugins.htmlmin({ // 默认只压缩空白字符
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true
        })))
    .pipe(dest(config.build.dist))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(
  extra, 
  parallel(
    series(compile, useref), 
    image, 
    font, 
    extra
  )  
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}