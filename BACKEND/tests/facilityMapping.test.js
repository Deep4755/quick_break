const { mapTomtomCategoriesToFacilities, enrichWithOperator, extractFacilitiesFromTomtomResult } = require("../src/utils/facilityMapper");

describe("facilityMapper", () => {
  test("Category contains fuel -> returns [\"fuel\"]", () => {
    const r = { poi: { categories: ["Fuel Station"] } };
    expect(mapTomtomCategoriesToFacilities(r)).toEqual(["fuel"]);
  });

  test("Operator Shell with no categories -> returns [\"fuel\"] via enrichment", () => {
    const r = { poi: { brands: [{ name: "Shell" }] } };
    // categories empty
    expect(extractFacilitiesFromTomtomResult(r)).toEqual(["fuel"]);
  });

  test("Unknown categories -> returns []", () => {
    const r = { poi: { categories: ["Library", "Park"] } };
    expect(mapTomtomCategoriesToFacilities(r)).toEqual([]);
  });

  test("Mixed categories -> deduplicated array", () => {
    const r = { poi: { categories: ["Fuel", "Petrol", "Cafe"] } };
    const mapped = mapTomtomCategoriesToFacilities(r);
    // should include fuel and food, deduped
    expect(mapped.sort()).toEqual(["food", "fuel"].sort());
  });
});
