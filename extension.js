const vscode = require('vscode')
const path = require('path')
const fs = require('fs')

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('🐞 || __dirname: ', __dirname, process.cwd(), vscode.workspace.rootPath)

    const customizeConfig = readConfig()
    const pathConfigFiles = ['jsconfig.json', 'tsconfig.json']
    const aliasConfigs = [
        {
            type: 'customize',
            filePath: customizeConfig.aliasConfigFilePath || ''
        },
        {
            type: 'webpack',
            field: 'resolve.alias',
            filePath: 'webpack.config.js',
        },
        {
            type: 'vue-cli',
            version: '3',
            field: 'configureWebpack.resolve.alias',
            filePath: 'vue.config.js'
        },
    ]

    const getJsconfigJsonTemplate = ({path}) => `
{
    "compilerOptions": {
        "target": "${customizeConfig.jsconfigTarget || "esnext"}",
        "module": "${customizeConfig.jsconfigModule || "esnext"}",
        "baseUrl": ".",
        "paths": ${path}
    },
    "include": [
        "src/**/*.ts",
        "src/**/*.js",
        "src/**/*.tsx",
        "src/**/*.vue",
        "tests/**/*.ts",
        "tests/**/*.tsx"
    ],
    "exclude": [
        "node_modules"
    ]
}
    `
    let isWorking = false
    /**
     * 1. 找到根目录
     * 2. 检查 jsconfig / tsconfig
     * 3. 找到 webpack.config.js / vue.config.js / 设置自定义配置目录
     * 4. 找到 3 中的 alias 字段，默认加上 @ path
     * 5. 到 2 中的文件声明 3 的内容
     */
    const disposable = vscode.commands.registerCommand('extension.generateJsconfig', function() {
        if (isWorking) return
        isWorking = true

        try {

            // 1. 找到根目录
            console.log('~~~~~~~~~~~~~~~~~~~~ 1')
            const rootPath = vscode.workspace.rootPath

            // 2. 找到jsconfig/tsconfig
            console.log('~~~~~~~~~~~~~~~~~~~~ 2')
            let configFileData = {}
            let configFilePath = ''
            for (const fileName of pathConfigFiles) {
                const filePath = path.resolve(rootPath, fileName)
                const isExists = fs.existsSync(filePath)
                if (isExists) {
                    configFilePath = filePath
                    configFileData = require(filePath)
                    break
                }
            }

            // 3. 从 webpack.config.js / vue.config.js / 设置自定义配置目录 取出内容
            console.log('~~~~~~~~~~~~~~~~~~~~ 3')
            let aliasData = null
            for (const aliasConfig of aliasConfigs) {
                const filePath = path.resolve(rootPath, aliasConfig.filePath)
                if (!aliasConfig.filePath) continue
                const isExists = fs.existsSync(filePath)
                if (isExists) {
                    const aliasConfigContent = require(filePath)
                    try {
                        aliasConfig.field.split('.').map(field => {
                            aliasData = (aliasData || aliasConfigContent)[field]
                        })
                    } catch (error) {
                        console.log('❌ find field error', error)
                    }
                    break
                }
            }
            // 值转数组
            for (const key in aliasData) {
                if (!Array.isArray(aliasData[key])) {
                    aliasData[key] = [aliasData[key]]
                }
            }

            // 4. 添加默认规则
            // 在模板中实现
            console.log('~~~~~~~~~~~~~~~~~~~~ 4')
            const defaultAliasPath = {
                "@/*": [ "src/*" ],
            }

            // 5. 到 2 中的文件声明 3 的内容
            console.log('~~~~~~~~~~~~~~~~~~~~ 5')
            const aliasPathResult = Object.assign({},
                // 默认内容
                defaultAliasPath,
                // 已有的 jsconfig.json / tsconfig.json 内的 alias
                // configFileData,
                // 读取编译配置得到的 alias
                aliasData
            )
            console.log('🐞 || configFile: ', configFileData, aliasPathResult)
            // 已有 jsconfig.josn / tsconfig.json
            if (configFilePath && configFileData) {
                const newCompilerOptions = Object.assign({},
                    configFileData.compilerOptions, {
                        baseUrl: ".",
                        paths: aliasPathResult,
                    }
                )
                const configFileResult = Object.assign({}, configFileData, {compilerOptions: newCompilerOptions})
                fs.writeFileSync(configFilePath, JSON.stringify(configFileResult, null, 4))
                return
            }
            // 没有的就生成一份 jsconfig.json
            else {
                const jsconfigJsonFilePath = path.resolve(rootPath, 'jsconfig.json')
                fs.writeFileSync(jsconfigJsonFilePath, getJsconfigJsonTemplate({
                    path: JSON.stringify(aliasPathResult)
                }))
            }
        } catch (error) {
            console.log('❌ error', error)
            vscode.window.showInformationMessage(JSON.stringify(error))
        }

        isWorking = false

        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World!')
    })

    context.subscriptions.push(disposable)
}

function readConfig() {
    const config = vscode.workspace.getConfiguration('auto-alias-path')

    return {
        aliasConfigFilePath: getConfigValueIfHas('aliasConfigFilePath', config),
        jsconfigTarget: getConfigValueIfHas('jsconfigTarget', config),
        jsconfigModule: getConfigValueIfHas('jsconfigModule', config),
    }
}
function getConfigValueIfHas(key, config) {
    if (config.has(key)) {
        return config.get(key)
    }

    return null
}

exports.activate = activate

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
}
