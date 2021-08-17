const { checkPackageJSON, updatePackageJSON, npmRunDeploy } = require('./common')
const log = console.log
const chalk = require('chalk')
const error = chalk.bold.red

async function run(cli) {
    if (!cli.flags.account || !cli.flags.app) {
        log('Error: Missing Flags')

        if (!cli.flags.account) {
            log('  --account [number] ( or -a [number] ) is required.')
        }
        if (!cli.flags.app) {
            log('  --app [number] ( or -i [number] ) is required.')
        }
        log('Example:')
        log('  $ npx sectionctl-static-deps scripts -a 1887 -i 7749')
        return
    }
    const [fileExists, packageJSON] = checkPackageJSON()
    if (!fileExists) {
        log(error('ERROR: package.json not found in this directory, please run `npm init -y`.'))
        return
    }

    await updatePackageJSON(false, null, packageJSON, cli.flags.account, cli.flags.app)

    const [result, pkgJSON] = checkPackageJSON()
    if (!result) {
        log(error('ERROR: package.json not found in this directory, please run `npm init -y`.'))
        return
    }

    if (typeof pkgJSON?.scripts?.start == 'string' && pkgJSON?.scripts?.start?.length) {
        await npmRunDeploy()
    } else {
        log(error('⚠️  Please add start script to your package.json'))
        log('Then run `npm run deploy` to deploy your app to Section')
    }
}
module.exports.run = run
