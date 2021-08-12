const spawn = require('cross-spawn')
const jsonpatch = require('jsonpatch')
const path = require('path')
const fs = require('fs')
const prompt = require('prompt')
const yn = require('yn')
const chalk = require('chalk')
const { checkPackageJSON, updatePackageJSON, npmRunDeploy } = require('./common')
const log = console.log
const error = chalk.bold.red
const warning = chalk.keyword('orange')

const ps = chalk.bold.white.bgBlack
const defaultNo = `[${chalk.yellowBright('y')}/${chalk.green('N')}]`
const defaultYes = `[${chalk.green('Y')}/${chalk.yellowBright('n')}]`

async function installServe(packageJSON, buildPath) {
    if (typeof packageJSON !== 'undefined') {
        if (typeof packageJSON.dependencies !== 'undefined') {
            if (packageJSON.dependencies.serve) {
                log('Serve is already installed. Skipping installation of serve.')
                return true
            } else {
                log(
                    chalk.cyanBright(
                        'Serve is used presently for serving static content for apps built with node.js.\nIf you app has a backend, please hit ctrl+c now.'
                    )
                )
                log(
                    chalk.yellowBright(
                        'This script is generally for apps that generate compiled, static HTML/CSS/JS to a build directory.'
                    )
                )
                log(
                    `Setting up serve is highly recommended for serving compiled content. \nAfter this prompt we will set up an serve server that serves all of the content in the '${chalk.cyanBright(
                        buildPath
                    )}' directory.`
                )
            }
        } else {
            log('Your package.json is missing the dependencies property.')
        }
    } else {
        log('Unable to parse package.json')
        return false
    }
    prompt.start()
    const installOK = ps(`OK to install serve in current node.js package? ${defaultYes}`)
    const res = await prompt.get(installOK)
    if (yn(res[installOK], { default: true })) {
        log(chalk.greenBright('Installing serve to your package...'))
        const result = spawn.sync('npm', ['install', '--save', 'serve'], {
            stdio: 'inherit'
        })
        console.log(chalk.greenBright('Successfully installed serve'))
        return true
    } else {
        console.error(
            'Serve is required to serve static content. You can also bring your own webserver package, but you must modify the start script to initialize it. \n Please run this script again and choose yes if you would like to continue.'
        )
        process.exit(1)
    }
}

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
        log('  $ npx "@section.io/sectionctl-helper" static build/ -a 1234 -i 5678')
        return
    }
    const buildPath = cli.input[1]

    let [fileExists, packageJSON] = checkPackageJSON()
    if (!fileExists) {
        log(error('ERROR: package.json not found in this directory.'))
        return
    }
    const serveInstalled = await installServe(packageJSON, buildPath)
    packageJSON = checkPackageJSON()[1]
    //TODO: Determine if npm run build exists, and if not, don't include it in predeploy.
    await updatePackageJSON(serveInstalled, buildPath, packageJSON, cli.flags.account, cli.flags.app)

    await npmRunDeploy()
}

module.exports.run = run
