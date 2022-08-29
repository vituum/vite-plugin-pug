import { dirname, resolve, relative } from 'path'
import fs from 'fs'
import process from 'node:process'
import FastGlob from 'fast-glob'
import lodash from 'lodash'
import pug from 'pug'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

const { name } = JSON.parse(fs.readFileSync(resolve(dirname((fileURLToPath(import.meta.url))), 'package.json')).toString())
const defaultOptions = {
    reload: true,
    root: null,
    filters: {},
    globals: {},
    data: '',
    filetypes: {
        html: /.(json.html|pug.json.html|pug.html)$/,
        json: /.(json.pug.html)$/
    },
    pug: {}
}

function processData(paths, data = {}) {
    let context = {}

    lodash.merge(context, data)

    FastGlob.sync(paths).forEach(entry => {
        const path = resolve(process.cwd(), entry)

        context = lodash.merge(context, JSON.parse(fs.readFileSync(path).toString()))
    })

    return context
}

const renderTemplate = async(filename, content, options) => {
    const output = {}
    const context = options.data ? processData(options.data, options.globals) : options.globals

    const isJson = filename.endsWith('.json.html') || filename.endsWith('.json')
    const isHtml = filename.endsWith('.html') && !filename.endsWith('.json.html')

    if (isJson || isHtml) {
        lodash.merge(context, isHtml ? content : JSON.parse(fs.readFileSync(filename).toString()))

        output.template = true

        context.template = relative(process.cwd(), context.template).startsWith(relative(process.cwd(), options.root))
            ? resolve(process.cwd(), context.template) : resolve(options.root, context.template)
    } else if (fs.existsSync(filename + '.json')) {
        lodash.merge(context, JSON.parse(fs.readFileSync(filename + '.json').toString()))
    }

    try {
        const template = pug.compileFile(output.template ? context.template : filename, Object.assign(options.pug, {
            basedir: options.root,
            filters: options.filters
        }))

        output.content = template(context)
    } catch(error) {
        output.error = error
    }

    return output
}

const plugin = (options = {}) => {
    options = lodash.merge(defaultOptions, options)

    return {
        name,
        config: ({ root }) => {
            if (!options.root) {
                options.root = root
            }
        },
        transformIndexHtml: {
            enforce: 'pre',
            async transform(content, { path, filename, server }) {
                path = path.replace('?raw', '')
                filename = filename.replace('?raw', '')

                if (
                    !options.filetypes.html.test(path) &&
                    !options.filetypes.json.test(path) &&
                    !content.startsWith('<script type="application/json" data-format="pug"')
                ) {
                    return content
                }

                if (content.startsWith('<script type="application/json" data-format="pug"')) {
                    const matches = content.matchAll(/<script\b[^>]*data-format="(?<format>[^>]+)"[^>]*>(?<data>[\s\S]+?)<\/script>/gmi)

                    for (const match of matches) {
                        content = JSON.parse(match.groups.data)
                    }
                }

                const render = await renderTemplate(filename, content, options)

                if (render.error) {
                    if (!server) {
                        console.error(chalk.red(render.error))
                        return
                    }

                    server.ws.send({
                        type: 'error',
                        err: {
                            message: render.error.message,
                            plugin: name
                        }
                    })
                }

                return render.content
            }
        },
        handleHotUpdate({ file, server }) {
            if (
                (typeof options.reload === 'function' && options.reload(file)) ||
                (options.reload && (options.filetypes.html.test(file) || options.filetypes.json.test(file)))
            ) {
                server.ws.send({ type: 'full-reload' })
            }
        }
    }
}

export default plugin
