const spawn = require('cross-spawn')
const jsonpatch = require('jsonpatch')
const path = require('path')
const fs = require('fs')
const prompt = require('prompt')
const yn = require('yn')
const chalk = require('chalk')
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
            return false
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

async function updatePackageJSON(expressInstalled, packageJSON, account, app) {
    log('Patching package.json...')
    const patches = []
    const availablePatches = [
        {
            op: 'add',
            path: '/scripts/start',
            value: 'node productionServer.js'
        },
        {
            op: 'add',
            path: '/scripts/predeploy',
            value: `npm install${packageJSON.scripts.build ? ` && npm run build` : ''}`
        },
        {
            op: 'add',
            path: '/scripts/deploy',
            value: `sectionctl deploy -a ${account} -i ${app}`
        }
    ]
    const replaceOK = ps(`OK to replace this value? ${defaultYes}`)
    for (const patch of availablePatches) {
        const script = path.parse(patch.path).base
        if (typeof packageJSON.scripts[script] === 'undefined' || packageJSON.scripts[script] !== patch.value) {
            if (typeof packageJSON.scripts[script] !== 'undefined') {
                if (script === 'start') {
                    if (!expressInstalled) {
                        log(`  Skipped updating the \`npm run start\` script because express.js wasn't installed.`)
                        continue
                    }
                }
                log('')
                if (script === 'start') {
                    log(
                        warning(
                            `     NOTE: npm run start is the entrypoint that section.io uses in production to run your app.`
                        )
                    )
                    log(
                        '    We installed express.js and added an entrypoint for it, so it is highly advised that you accept this replacement.'
                    )
                    log(
                        '    If your script currently runs development scripts, it will automatically be moved to `npm run start-dev`'
                    )
                }
                log(`  ${warning(`Warning:`)} going to replace \`${chalk.greenBright(`npm run ${script}`)}\``)
                script !== 'start' &&
                    log(
                        `  Your original script will be backed up as \`${chalk.yellowBright(`npm run ${script}-old`)}\``
                    )
                log(`  ${chalk.cyan('Current Value:')} ${packageJSON.scripts[script]}`)
                log(`      ${chalk.cyan('New Value:')} ${patch.value}`)
                prompt.start()
                const res = await prompt.get(replaceOK)
                if (yn(res[replaceOK], { default: true })) {
                    if (script === 'start') {
                        if (typeof packageJSON.scripts['start-dev'] === 'undefined') {
                            patches.push({
                                op: 'add',
                                path: '/scripts/start-dev',
                                value: packageJSON.scripts[script]
                            })
                        }
                    } else {
                        patches.push({
                            op: 'add',
                            path: `/scripts/${script}-old`,
                            value: packageJSON.scripts[script]
                        })
                    }
                    patches.push(patch)
                } else {
                    log(`  Skipping patch of \`npm run ${script}\``)
                }
            } else {
                patches.push(patch)
            }
        }
    }
    if (patches.length > 0) {
        patcheddoc = JSON.stringify(jsonpatch.apply_patch(packageJSON, patches), null, 2)
        fs.copyFileSync(path.resolve(path.resolve('package.json')), path.resolve(path.resolve('package.json.bak')))
        log('  Backed up your existing package.json to package.json.bak')
        fs.writeFileSync(path.resolve('package.json'), patcheddoc)
        log('  Added scripts to your package.json.')
    } else {
        log(
            '  Addition of scripts to the package.json is unnecessary as they are already what they should be. Skipping.'
        )
    }
}

async function checkServerConf() {
    if (!fs.existsSync(path.resolve('server.conf'))) {
        log('')
        log('your server.conf is not defined. Please run the following to initialize a server.conf:')
        log('sectionctl apps init')
        prompt.start()
        const installOK = ps(`OK to run sectionctl apps init in current directory? ${defaultYes}`)
        const res = await prompt.get(installOK)
        if (yn(res[installOK], { default: true })) {
            const result = spawn.sync('sectionctl', ['apps', 'init'], {
                stdio: 'inherit'
            })
        }
    }
    log('')
    log(chalk.greenBright('🎉 Success!'))
    log(`You can now run \`${chalk.greenBright('npm run deploy')}\` to deploy your app on section.`)
    prompt.start()
    const deployOK = ps(`Run \`npm run deploy\` now? ${defaultNo}`)
    const res = await prompt.get(deployOK)
    if (yn(res[deployOK], { default: false })) {
        log('running `npm run deploy`')
        const result = spawn.sync('npm', ['run', 'deploy'], {
            stdio: 'inherit'
        })
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
        log('  $ npx sectionctl-static-deps build/ -a 1887 -i 7749')
        return
    }
    const buildPath = cli.input[1]
    const packageJsonPath = path.resolve('package.json')
    if (!fs.existsSync(packageJsonPath)) {
        log('package.json not found.')
        return
    }
    const jsonContent = fs.readFileSync(packageJsonPath, 'utf8')
    const packageJSON = JSON.parse(jsonContent)

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
