import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

export default [
  {
    input: 'src/index.ts',
    output: {
        file: 'index.js'
    },
    plugins: [typescript()]
  },
  {
    input: 'dist/index.d.ts',
    output: {
      file: 'index.d.ts'
    },
    plugins: [dts()]
  },
]