import fs from 'node:fs/promises'
import path from 'node:path'

const sourcePath = path.join(process.cwd(), 'public/data/medicament_ma_optimized.json')
const searchOutputPath = path.join(process.cwd(), 'public/data/medicament_search_index.json')
const listOutputPath = path.join(process.cwd(), 'public/data/medicament_list_index.json')

function normalize(input = '') {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((item) => String(item)).filter(Boolean)
}

async function generate() {
  const raw = await fs.readFile(sourcePath, 'utf8')
  const drugs = JSON.parse(raw)

  const searchIndex = drugs.map((drug) => {
    const activeIngredient = toStringArray(drug.activeIngredient)

    return {
      id: String(drug.id),
      name: String(drug.name ?? ''),
      activeIngredient,
      dosageForm: typeof drug.dosageForm === 'string' ? drug.dosageForm : undefined,
      strength: typeof drug.strength === 'string' ? drug.strength : undefined,
      manufacturer: typeof drug.manufacturer === 'string' ? drug.manufacturer : undefined,
      searchKey: normalize(`${drug.name ?? ''} ${activeIngredient.join(' ')}`),
    }
  })

  const listIndex = drugs.map((drug) => ({
    id: String(drug.id),
    name: String(drug.name ?? ''),
    activeIngredient: toStringArray(drug.activeIngredient),
    dosageForm: typeof drug.dosageForm === 'string' ? drug.dosageForm : undefined,
    strength: typeof drug.strength === 'string' ? drug.strength : undefined,
    manufacturer: typeof drug.manufacturer === 'string' ? drug.manufacturer : undefined,
    therapeuticClass: toStringArray(drug.therapeuticClass),
    '@type': drug['@type'] === 'MedicalDevice' ? 'MedicalDevice' : 'Drug',
    productType: drug.productType === 'MedicalDevice' ? 'MedicalDevice' : 'Drug',
  }))

  await Promise.all([
    fs.writeFile(searchOutputPath, JSON.stringify(searchIndex), 'utf8'),
    fs.writeFile(listOutputPath, JSON.stringify(listIndex), 'utf8'),
  ])

  // eslint-disable-next-line no-console
  console.log(`Wrote ${searchIndex.length} records to ${searchOutputPath}`)
  // eslint-disable-next-line no-console
  console.log(`Wrote ${listIndex.length} records to ${listOutputPath}`)
}

generate().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
