const homeDirectoryName = "src";
const outputDirectoryName = "dist"
const bundleName = "recipes.js";


const { FuseBox } = require("fuse-box");

const fuse = FuseBox.init({
  useTypescriptCompiler: true,
  homeDir: `${homeDirectoryName}/`,
  target: "server@esnext", //by targeting server you can use node
  output: `${outputDirectoryName}/$name.js`
});
fuse.dev(); // launch http server
fuse
  .bundle(bundleName)
  .instructions("> main.ts")
  // .hmr()
  .watch()
  // .completed(proc=>proc.start()) //If you want to auto-start after changes are made in any source files
fuse.run();
