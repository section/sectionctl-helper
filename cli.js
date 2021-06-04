#!/usr/bin/env node

const meow = require('meow')
const commands = require('./src/index.js')
const cli = meow(
    `
  static:
    Description
        This will install serve and add scripts to run serve and deploy your app.
	Usage
	  $ sectionctl-helper static [build-dir] [options]
	Options
    --account, -a    Section.io account ID
    --app, -i    Section.io application ID
    Examples
     # With NPX
      $ npx "@section.io/sectionctl-helper" static build/ -a 1234 -i 5678
     # Or with it installed in your node_modules
      $ sectionctl-helper static build/ -a 1234 -i 5678
  scripts:
    Description:
        If you don't want to use serve (ie if your app uses its own node.js webserver runtime), you can use this command to just add the scripts to your package.json.
      Usage
        $ sectionctl-helper scripts [options]
      Options
      --account, -a    Section.io account ID
      --app, -i    Section.io application ID
      Examples
       # With NPX
        $ npx "@section.io/sectionctl-helper" scripts -a 1234 -i 5678
       # Or with it installed in your node_modules
        $ sectionctl-helper scripts -a 1234 -i 5678
    
  help:
    Usage
      $ npx "@section.io/sectionctl-helper" help
`,
    {
        flags: {
            account: { type: 'number', alias: 'a' },
            app: { type: 'number', alias: 'i' }
        }
    }
)

if (cli.input.length === 0) {
    console.log(cli.help)
} else {
    const command = cli.input[0]
    switch (command) {
        case 'static':
            commands.static(cli)
            break
        case 'scripts':
            commands.scripts(cli)
            break
        default:
            console.log(cli.help)
            break
    }
}
