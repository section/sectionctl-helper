const spawn = require('cross-spawn')
const jsonpatch = require('jsonpatch')
const path = require('path')
const fs = require('fs')
const prompt = require('prompt')
const yn = require('yn')
const chalk = require('chalk')
const { checkPackageJSON, updatePackageJSON, checkServerConf } = require('./common')
const log = console.log
const error = chalk.bold.red
const warning = chalk.keyword('orange')

const ps = chalk.bold.white.bgBlack
const defaultNo = `[${chalk.yellowBright('y')}/${chalk.green('N')}]`
const defaultYes = `[${chalk.green('Y')}/${chalk.yellowBright('n')}]`

async function installExpress(packageJSON, buildPath) {
    if (typeof packageJSON !== 'undefined') {
        if (typeof packageJSON.dependencies !== 'undefined') {
            if (packageJSON.dependencies.express) {
                log('Express is already installed. Skipping installation of Express.')
                return true
            } else {
                log(
                    chalk.cyanBright(
                        'ExpressJS is used presently for serving static content for apps built with node.js.\nIf you app has a backend, please hit ctrl+c now.'
                    )
                )
                log(
                    chalk.yellowBright(
                        'This script is generally for apps that generate compiled, static HTML/CSS/JS to a build directory.'
                    )
                )
                log(
                    `Setting up express is highly recommended for serving compiled content. \nAfter this prompt we will set up an express.js server that serves all of the content in the '${chalk.cyanBright(
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
    const installOK = ps(`OK to install express.js in current node.js package? ${defaultYes}`)
    const res = await prompt.get(installOK)
    if (yn(res[installOK], { default: true })) {
        log(chalk.greenBright('Installing express.js to your package...'))
        const result = spawn.sync('npm', ['install', '--save', 'express'], {
            stdio: 'inherit'
        })
        console.log('')
        console.log(chalk.greenBright('Successfully installed express.js'))
        return true
    } else {
        return false
    }
}
const updateExpressEntrypoint = (buildPath) => {
    log('')
    log('Handling installation of express.js entrypoint (productionServer.js)...')
    const expressTemplate = fs
        .readFileSync(path.resolve(`${__dirname}/productionServer.js`), {
            encoding: 'utf8',
            flag: 'r'
        })
        .replace(/replaceme/, buildPath)
    if (fs.existsSync(path.resolve('productionServer.js'))) {
        const existingTemplate = fs.readFileSync(path.resolve('productionServer.js'), { encoding: 'utf8', flag: 'r' })
        if (existingTemplate !== expressTemplate) {
            log('  productionServer.js exists and is different than the generated output. Skipped updating this file.')
            log('  Delete productionServer.js if you want to force the reinstallation of it.')
            log('')
            return
        }
    }
    fs.writeFileSync(path.resolve('./productionServer.js'), expressTemplate)
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

    const [fileExists, packageJSON] = checkPackageJSON()
    if (!fileExists) {
        log(error('ERROR: package.json not found in this directory.'))
        return
    }
    const expressInstalled = await installExpress(packageJSON, buildPath)
    if (expressInstalled) {
        //TODO: Determine entrypoint via framework, and prompt if not known.
        await updateExpressEntrypoint(buildPath)
    }
    //TODO: Determine if npm run build exists, and if not, don't include it in predeploy.
    await updatePackageJSON(expressInstalled, packageJSON, cli.flags.account, cli.flags.app)

    await checkServerConf()
}

module.exports.run = run
