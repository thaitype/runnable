import { Runnable } from '@thaitype/runnable'

const runner = new Runnable({
  name: 'Windows setup',
  enableStateCheck: true,
  execaOptions: {
    /**
     * Shell ref: https://github.com/sindresorhus/execa/blob/main/docs/shell.md
     */
    shell: 'powershell', // make sure PowerShell is used
    /**
     * Windows options ref: https://github.com/sindresorhus/execa/blob/main/docs/windows.md
     */
    windowsVerbatimArguments: true, // Use verbatim arguments to avoid issues with PowerShell escaping
  }
})

await runner.run([
  {
    name: 'Ensure C:\\Temp folder exists',
    shell: `if (!(Test-Path 'C:\\Temp')) { New-Item -ItemType Directory -Force -Path 'C:\\Temp' }`,
    skipIfDone: true,
    when: async (shell) => {
      try {
        await shell(`Test-Path 'C:\\Temp'`)
        return false // Already exists → skip
      } catch {
        return true // Error → try creating
      }
    },
  },
  {
    name: 'Print PowerShell version',
    shell: `Write-Host "PowerShell version: $($PSVersionTable.PSVersion)"`,
    skipIfDone: false,
  },
  {
    name: 'Check winget availability',
    shell: `winget --version`,
    skipIfDone: true,
    when: async (shell) => {
      try {
        await shell(`winget --version`)
        return false // Found → skip
      } catch {
        throw new Error('❌ winget is not available on this system')
      }
    },
  },
]);
