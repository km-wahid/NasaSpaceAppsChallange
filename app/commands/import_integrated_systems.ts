import { BaseCommand, args } from '@adonisjs/core/ace'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { importIntegratedFarming } from '#services/integrated_farming_import_service'

export default class ImportIntegratedSystems extends BaseCommand {
  static commandName = 'integrated-systems:import'
  static description = 'Validate and import reviewed integrated farming evidence from JSON'
  static options = { startApp: true }

  @args.string({ description: 'JSON file path relative to the application directory' })
  declare file: string

  async run() {
    try {
      const document = JSON.parse(
        await readFile(resolve(this.app.appRoot.pathname, this.file), 'utf8')
      )
      const result = await importIntegratedFarming(document)
      this.logger.success(
        `Imported ${result.systems} systems, ${result.companions} companions and ${result.sources} sources.`
      )
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }
}
