// Facility extraction utilities for TomTom results
function mapTomtomCategoriesToFacilities(r) {
  const cats = [];
  const rawCats = [];
  if (Array.isArray(r.poi?.categories)) rawCats.push(...r.poi.categories);
  if (Array.isArray(r.poi?.categorySet)) rawCats.push(...r.poi.categorySet);
  if (Array.isArray(r.poi?.classifications)) rawCats.push(...r.poi.classifications.map((c) => c.name || c));
  if (r.poi?.category) rawCats.push(r.poi.category);

  const txt = rawCats.join(" ").toLowerCase();

  if (/fuel|petrol|gas/.test(txt)) cats.push("fuel");
  if (/restaurant|cafe|food/.test(txt)) cats.push("food");
  if (/toilet|restroom/.test(txt)) cats.push("toilets");
  if (/parking/.test(txt)) cats.push("parking");
  if (/electric|ev|charging|charger/.test(txt)) cats.push("ev");

  return Array.from(new Set(cats));
}

function enrichWithOperator(facilities, operator) {
  const out = Array.isArray(facilities) ? [...facilities] : [];
  const fuelBrands = ["Shell", "BP", "Esso", "Texaco", "JET", "Total", "Asda", "Morrisons"];
  if (operator && fuelBrands.includes(operator)) {
    if (!out.includes("fuel")) out.push("fuel");
  }
  return Array.from(new Set(out));
}

// Convenience: extract facilities from a full TomTom result object
function extractFacilitiesFromTomtomResult(r) {
  const fromCats = mapTomtomCategoriesToFacilities(r);
  const operator = r.poi?.brands?.[0]?.name || null;
  return enrichWithOperator(fromCats, operator);
}

module.exports = {
  mapTomtomCategoriesToFacilities,
  enrichWithOperator,
  extractFacilitiesFromTomtomResult,
};
