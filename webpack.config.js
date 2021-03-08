const path = require('path');

module.exports = {
  mode: "production", // "production" | "development" | "none"  // Chosen mode tells webpack to use its built-in optimizations accordingly.

  entry: "./index.js", // string | object | array

  target: "node",
  
  // 这里应用程序开始执行
  // webpack 开始打包

  output: {
    // webpack 如何输出结果的相关选项

    path: path.resolve(__dirname, "dist"), // string
    // 所有输出文件的目标路径
    // 必须是绝对路径（使用 Node.js 的 path 模块）

    filename: process.env.NODE_ENV === 'production' ? "looksSame.min.js" : "looksSame.js", // string    // 「入口分块(entry chunk)」的文件名模板（出口分块？）

    library: "looksSame", // string,
    // 导出库(exported library)的名称

    libraryTarget: "commonjs", // 通用模块定义    // 导出库(exported library)的类型
  },

  optimization: {
    minimize: process.env.NODE_ENV === 'production'? true : false
  },

  module: {
    // 关于模块配置

    rules: [
      // 模块规则（配置 loader、解析器等选项）

      {
        test: /\.jsx?$/,
        exclude: [
          path.resolve(__dirname, 'node_modules')
        ],
        loader: "babel-loader"
      },
    ],
}
}