import { Runnable } from '@thaitype/runnable'
import { execaCommand } from 'execa'

const runner = new Runnable({
  stateFilePath: 'mac-setup-state.json',
})

await runner.run([
  {
    name: 'echo hello',
    shell: 'echo "Hello from step 1"',
    skip_if_done: true,
  },
  {
    name: 'install-homebrew',
    skip_if_done: true,
    when: async shell => {
      try {
        await shell('brew --version');
        return false // Homebrew is already installed
      } catch {
        return true // Homebrew is not installed, proceed with installation
      }
    },

    // when: async () => {
    //   try {
    //     await execaCommand('brew --version')
    //     return false // พบแล้ว = ไม่ต้องรัน
    //   } catch {
    //     return true // ไม่เจอ = ต้องรัน
    //   }
    // },
    shell: `
      echo "Installing Homebrew..."
      echo "Please enter your password if prompted."
    `,
  },
])