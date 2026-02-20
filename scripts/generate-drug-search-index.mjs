import fs from 'node:fs/promises'
import path from 'node:path'

const sourcePath = path.join(process.cwd(), 'public/data/medicament_ma_optimized.json')
const outputPath = path.join(process.cwd(), 'public/data/medicament_search_index.json')

function normalize(input = '') {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function generate() {
  const raw = await fs.readFile(sourcePath, 'utf8')
  const drugs = JSON.parse(raw)

  const index = drugs.map((drug) => {
    const dci = Array.isArray(drug.activeIngredient) ? drug.activeIngredient : []

    return {
      id: String(drug.id),
      name: String(drug.name ?? ''),
      activeIngredient: dci,
      dosageForm: typeof drug.dosageForm === 'string' ? drug.dosageForm : undefined,
      strength: typeof drug.strength === 'string' ? drug.strength : undefined,
      manufacturer: typeof drug.manufacturer === 'string' ? drug.manufacturer : undefined,
      searchKey: normalize(`${drug.name ?? ''} ${dci.join(' ')}`),
    }
  })

  await fs.writeFile(outputPath, JSON.stringify(index), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Wrote ${index.length} records to ${outputPath}`)
}

generate().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
