const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background.ts",
    "content-script": "./src/content-script.ts",
  },
  devtool: false,
  optimization: {
    minimize: true,
  },
  // output: {
  //   path: path.resolve(__dirname, "dist/extension-tracker-scan"),
  //   filename: "[name].js",
  //   clean: true,
  // },
  resolve: {
    // fallback: {
    //   vm: false,
    // },
    extensions: [".ts", ".js"],
    // alias: {
    //   "@": path.resolve(__dirname, "src"),
    // },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "public", to: "public" }],
    }),
  ],
  //   new HtmlWebpackPlugin({
  //     template: "./src/index.html",
  //     filename: "index.html",
  //     chunks: ["popup"],
  //   }),
  // ],
};
