const spawn = require('cross-spawn')
const jsonpatch = require('jsonpatch')
const path = require('path')
const fs = require('fs')
const prompt = require('prompt')
const yn = require('yn')

async function installExpress(packageJSON, buildPath) {
    if (packageJSON?.dependencies?.express || packageJSON?.devDependencies?.express || false) {
        console.log('Express is already installed. Skipping installation of Express.')
        return true
    } else {
        console.log(
            'ExpressJS is used with hosted node.js apps on section for use with static sites (front-end frameworks). These generally generate compiled, static HTML/CSS/JS to a build directory.'
        )
        console.log(
            `This is required to serve static content. After the following prompt we will set up an express.js server that serves all of the content in the following directory: ${buildPath}`
        )
    }
    prompt.start()
    const installOK = 'OK to install express.js in current node.js package? [Y/n]'
    const res = await prompt.get(installOK)
    if (yn(res[installOK], { default: true })) {
        console.log('installing express.js to your package')
        const result = spawn.sync('npm', ['install', '--save', 'express'], {
            stdio: 'inherit'
        })
        return true
    } else {
        return false
    }
}
const updateExpressEntrypoint = (buildPath) => {
    console.log('')
    console.log('Handling installation of express.js entrypoint (productionServer.js)...')
    const expressTemplate = fs
        .readFileSync(path.resolve(`${__dirname}/productionServer.js`), {
            encoding: 'utf8',
            flag: 'r'
        })
        .replace(/replaceme/, buildPath)
    if (fs.existsSync(path.resolve('productionServer.js'))) {
        const existingTemplate = fs.readFileSync(path.resolve('productionServer.js'), { encoding: 'utf8', flag: 'r' })
        if (existingTemplate !== expressTemplate) {
            console.log(
                '  productionServer.js exists and is different than the generated output. Skipped updating this file.'
            )
            console.log('  Delete productionServer.js if you want to force the reinstallation of it.')
            console.log('')
            return
        }
    }
    fs.writeFileSync(path.resolve('./productionServer.js'), expressTemplate)
}

async function updatePackageJSON(expressInstalled, packageJSON, account, app) {
    console.log('Patching package.json...')
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
    const replaceOK = 'OK to replace this value? [Y/n]'
    for (const patch of availablePatches) {
        const script = path.parse(patch.path).base
        if (typeof packageJSON.scripts[script] === 'undefined' || packageJSON.scripts[script] !== patch.value) {
            if (typeof packageJSON.scripts[script] !== 'undefined') {
                if (script === 'start') {
                    if (!expressInstalled) {
                        console.log(
                            `  Skipped updating the \`npm run start\` script because express.js wasn't installed.`
                        )
                        continue
                    }
                }
                console.log('')
                if (script === 'start') {
                    console.log(
                        '  NOTE: npm run start is the entrypoint that section.io uses in production to run your app.'
                    )
                    console.log(
                        '    We installed express.js and added an entrypoint for it, so it is highly advised that you accept this replacement.'
                    )
                    console.log(
                        '    If your script currently runs development scripts, it will automatically be moved to `npm run start-dev`'
                    )
                }
                console.log(`  Warning: going to replace \`npm run ${script}\``)
                console.log(`  Current Value: ${packageJSON.scripts[script]}`)
                console.log(`      New Value: ${patch.value}`)
                prompt.start()
                const res = await prompt.get(replaceOK)
                if (yn(res[replaceOK], { default: true })) {
                    if (script === 'start' && typeof packageJSON.scripts['start-dev'] === 'undefined') {
                        patches.push({
                            op: 'add',
                            path: '/scripts/start-dev',
                            value: packageJSON.scripts[script]
                        })
                    }
                    patches.push(patch)
                } else {
                    console.log(`  Skipping patch of \`npm run ${script}\``)
                }
            } else {
                patches.push(patch)
            }
        }
    }
    if (patches.length > 0) {
        patcheddoc = JSON.stringify(jsonpatch.apply_patch(packageJSON, patches), null, 2)
        fs.copyFileSync(path.resolve(path.resolve('package.json')), path.resolve(path.resolve('package.json.bak')))
        console.log('  Backed up your existing package.json to package.json.bak')
        fs.writeFileSync(path.resolve('package.json'), patcheddoc)
        console.log('  Added scripts to your package.json.')
    } else {
        console.log(
            '  Addition of scripts to the package.json is unnecessary as they are already what they should be. Skipping.'
        )
    }
}

async function checkServerConf() {
    if (!fs.existsSync(path.resolve('server.conf'))) {
        console.log('')
        console.log('your server.conf is not defined. Please run the following to initialize a server.conf:')
        console.log('sectionctl apps init')
        prompt.start()
        const installOK = 'OK to run sectionctl apps init in current directory? [Y/n]'
        const res = await prompt.get(installOK)
        if (yn(res[installOK], { default: true })) {
            console.log('installing express.js to your package')
            const result = spawn.sync('sectionctl', ['apps', 'init'], {
                stdio: 'inherit'
            })
        }
    }
    console.log('')
    console.log('🎉 Success!')
    console.log('You can now run `npm run deploy` to deploy your app on section.')
    prompt.start()
    const deployOK = 'Run `npm run deploy` now? [y/N]'
    const res = await prompt.get(deployOK)
    if (yn(res[deployOK], { default: false })) {
        console.log('running `npm run deploy`')
        const result = spawn.sync('npm', ['run', 'deploy'], {
            stdio: 'inherit'
        })
    }
}
async function run(cli) {
    if (!cli.flags.account || !cli.flags.app) {
        console.log('Error: Missing Flags')

        if (!cli.flags.account) {
            console.log('  --account [number] ( or -a [number] ) is required.')
        }
        if (!cli.flags.app) {
            console.log('  --app [number] ( or -i [number] ) is required.')
        }
        console.log('Example:')
        console.log('  $ npx sectionctl-static-deps build/ -a 1887 -i 7749')
        return
    }
    const buildPath = cli.input[1]
    const packageJsonPath = path.resolve('package.json')
    if (!fs.existsSync(packageJsonPath)) {
        console.log('package.json not found.')
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
