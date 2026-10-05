// Call an Orca runtime RPC through the CLI's own client (the CLI has no
// command for project groups / folder workspaces).
// Run with: ELECTRON_RUN_AS_NODE=1 <Orca.app>/Contents/MacOS/Orca orca-rpc.js <method> [json-params]
// Prints the RPC `result` as JSON; exits 1 on any error.
const path = require('path');

const cliDir = path.join(process.env.ORCA_APP || '/Applications/Orca.app', 'Contents/Resources/app.asar.unpacked/out/cli');
const { RuntimeClient } = require(path.join(cliDir, 'runtime/client.js'));

const [method, params] = process.argv.slice(2);
new RuntimeClient()
  .call(method, params ? JSON.parse(params) : {})
  .then((res) => console.log(JSON.stringify(res.result)))
  .catch((err) => {
    console.error(`orca rpc ${method} failed: ${err.message}`);
    process.exit(1);
  });
