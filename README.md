# sgh-pages

使用Gulp开发的一个自动化构建工作流模块，可以**实现基本的项目资源压缩打包**及一些**自动化构建**任务，**支持自定义配置**

具体使用：

项目已发布至npm官网，可以直接通过npm安装

```
yarn init --yes
yarn add sgh-pages --dev
yarn sgh-pages [build] // 提供clean、build、develop三种模式 
```

配置文件可通过/lib/index.js config build 修改。

可自定义项目根目录`src`、打包文件路径`dist`、项目开发环境缓存文件`temp`、项目公共资源文件`public`，以及其他资源的目录`path`。

