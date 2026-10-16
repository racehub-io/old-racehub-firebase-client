const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env) => {
  const buildRoot = path.resolve(__dirname, "dist");
  const srcRoot = path.resolve(__dirname, "src");

  const isDev = env === "dev";
  const sourceMap = isDev;
  const minimize = !isDev; //we only minimise in production env

  return {
    mode: isDev ? "development" : "production",
    devtool: sourceMap ? "source-map" : false,
    entry: "./pages/src/index.jsx",
    output: {
      path: path.resolve(__dirname, ".."),
      filename: "pages/index.js",
    },
    resolve: {
      extensions: ["*", ".js", ".jsx"],
    },
    plugins: [new MiniCssExtractPlugin({ filename: "style.css" })],
    module: {
      rules: [
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                import: false,
                modules: true,
              },
            },
          ],
          include: /\.module\.css$/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
          exclude: /\.module\.css$/,
        },
      ],
    },
  };
};
