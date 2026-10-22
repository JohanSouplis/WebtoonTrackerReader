const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    background: "./src/background.ts",
    "content-script": "./src/content-script.ts",
  },
  devtool: false,
  optimization: {
    minimize: true,
  },
  output: {
    path: path.resolve(__dirname, "dist/extension-tracker-scan/browser"),
    filename: "[name].js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: { compilerOptions: { target: "ES2022" } },
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: "src/assets", to: "public" }],
    }),
  ],
};
