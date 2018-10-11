//TODO: fix pagination again
const findPropertiesWithRange = async function findPropertiesWithRange(store, typeUri, rangeUri){
  let params = {'filter[domain][rdfa-type]': typeUri,
                'filter[range][rdfa-type]': rangeUri,
                'include': 'range,domain'};
  let results  = await store.query('rdfs-property', params);
  return results;
};

export {
  findPropertiesWithRange
}
