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

function checkPackageJSON() {
    const packageJsonPath = path.resolve('package.json')
    if (!fs.existsSync(packageJsonPath)) {
        log('package.json not found.')
        return [false, undefined]
    }
    const jsonContent = fs.readFileSync(packageJsonPath, 'utf8')
    const packageJSON = JSON.parse(jsonContent)
    return [true, packageJSON]
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
            value: `npm install${
                typeof packageJSON.scripts !== 'undefined' && packageJSON.scripts.build ? ` && npm run build` : ''
            }`
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

async function npmRunDeploy() {
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

module.exports = { checkPackageJSON, npmRunDeploy, updatePackageJSON }
