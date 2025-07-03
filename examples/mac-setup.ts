import { Runnable } from '@thaitype/runnable'

const runner = new Runnable({
  stateFilePath: 'mac-setup-state.json',
})

await runner.run([
  {
    name: 'echo hello',
    shell: 'echo "Hello from step 1"',
    skip_if_done: true,
  },
  // {
  //   name: 'check timezone',
  //   shell: 'tzutil /s "SE Asia Standard Time"',
  //   when: async () => {
  //     const { stdout } = await import('execa').then(e => e.execaCommand('tzutil /g'))
  //     return stdout.trim() !== 'SE Asia Standard Time'
  //   },
  //   skip_if_done: true,
  // },
])