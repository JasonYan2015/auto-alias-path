## auto-alias-path

根据当前项目的webpack配置自动生成jsconfig.json来帮助vscode识别路径别名跳转

### 使用方法

1. 使用vscode打开项目
2. cmd + shift + p (OSX) / ctrl + shift + p (windows)
3. 在 2 打开的面板中输入 generate jsconfig
4. 执行，则会在当前项目根目录创建 jsconfig.json

#### 可配置字段

aliasConfigFilePath: 项目webpack配置文件所在相对于项目根目录的路径（比如 build/webpack.config.base.js）
jsconfigTarget: 生成 jsconfig.json 声明其中的 `target` 字段，默认 `esnext`
jsconfigModule: 生成 jsconfig.json 声明其中的 `module` 字段，默认 `esnext`

### 工作原理：

1. 找到项目根目录
2. 检查 jsconfig.json / tsconfig.json 文件是否已存在
3. 找到 webpack.config.js / vue.config.js / {设置自定义配置目录} 的webpack配置
4. 找到 3 中的 `alias` 字段，默认加上 `@` 指向根目录的 `src`
5. 写文件 jsconfig.json / 在已有的jsconfig.json上补充 `paths` 字段

### 目前使用上的一些限制

1. 从工作原理也可以看出：
    目前默认支持自动搜寻项目根目录下的 webpack.config.js 、 vue.config.js ，如果是其他目录的，可以去vscode的设置中配置当前插件的 aliasConfigFilePath 设置
2. webpack配置使用的 `require` 直接读取内存数据，也就是说，打开vscode初始化插件之后，每一次的生成结果都是一样的，如果中途修改了webpack别名配置，需要再生成一次，需要重新打开vscode初始化插件。这一点留作后续优化
3. jsconfig.json支持的字段很多，目前仅支持自定义 `compilerOptions.target` 和 `compilerOptions.module`，具体使用的模板如下
    ```javascript
    `
    {
        "compilerOptions": {
            "target": "${Config.jsconfigTarget || "esnext"}",
            "module": "${Config.jsconfigModule || "esnext"}",
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
    ```
