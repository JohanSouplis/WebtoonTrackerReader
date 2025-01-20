const path = require("path");
const { json } = require("stream/consumers");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/background.js",
  output: {
    filename: "background.js",
    path: path.resolve(__dirname, "dist/extension"),
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      ,
      {
        test: /\.json$/,
        type: "json",
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/content.js", to: "content.js" },
        { from: "public/icone.png", to: "icone.png" },
      ],
    }),
  ],
};
