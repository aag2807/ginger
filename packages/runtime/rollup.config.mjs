import cleanup from 'rollup-plugin-cleanup'
import filesize from 'rollup-plugin-filesize'

function JsxGinger(options)
{
    return {
        transform:(code, id)  => {
            return {
                code: code,
            }
        }
    }
}

export default {
    input: 'src/index.js',
    plugins: [cleanup(), JsxGinger()],
    output: [
        {
            file: 'dist/ginger.js',
            format: 'esm',
            plugins: [filesize()],
        },
    ],
}
