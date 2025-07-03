import { Runnable } from '@thaitype/runnable'

const runner = new Runnable({
  stateFilePath: 'mac-setup-state.json',
  enableStateCheck: true,
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
    shell: `
      echo "Installing Homebrew..."
      echo "Please enter your password if prompted."
    `,
  },
])