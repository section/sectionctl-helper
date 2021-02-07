#!/usr/bin/env node

const meow = require('meow')
const commands = require('./src/index.js')
const cli = meow(
    `
  static:
	Usage
	  $ sectionctl-helper static [build-dir] [options]
	Options
    --account, -a    Section.io account ID
    --app, -i    Section.io application ID
	Examples
      $ npx sectionctl-static-deps build/ -a 1887 -i 7749
    
  help:
    Usage
      $ sectionctl-helper help
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
        default:
            console.log(cli.help)
            break
    }
}
