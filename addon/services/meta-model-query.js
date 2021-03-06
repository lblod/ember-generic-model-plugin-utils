import Service, { inject as service } from '@ember/service';
import { waitForProperty } from 'ember-concurrency';
import { dropTask } from 'ember-concurrency-decorators';
export default class MetaModelQueryService extends Service {
  @service store;
  metaModelLoaded = false;

  constructor() {
    super(...arguments);
    this.loadMetaModel.perform();
  }
  /**
   * will load the entire meta model into the store, needs to run only once
   * whether the meta model is loading or not is stored in this.metaModelLoaded
   * the ember concurrency helper waitForProperty can be used to check if the model is already loaded
   */
  @dropTask
  *loadMetaModel() {
    if(this.metaModelLoaded)
      return;
    const pageSize = 20;
    let pageNumber = 0;
    let queryParams = {
      include:'range,domain',
      page: { size: pageSize, number: pageNumber }
    };
    try {
      const rdfsProperty = yield this.get('store').query('rdfs-property', queryParams);
      const meta = rdfsProperty.meta;
      while (meta && meta.count > pageSize * pageNumber) {
        pageNumber = pageNumber + 1;
        queryParams.page.number = pageNumber;
        yield this.store.query('rdfs-property', queryParams);
      }
      this.set('metaModelLoaded', true);
    }
    catch(e) {
      // TODO: should we retry?
      console.warn('failed to retrieve properties', e);
    }
  }

  //TODO: rename this function
  async findPropertiesWithRange(typeUri, rangeUri){
    typeUri = typeUri.toLowerCase();
    rangeUri = rangeUri.toLowerCase();
    await waitForProperty(this, 'metaModelLoaded', true);
    return this.store.peekAll('rdfs-property').filter(rdfsProp => {
      return rdfsProp.get('domain')
        .filter(cl => cl.rdfaType)
        .find(cl => cl.rdfaType.toLowerCase() === typeUri)
        && rdfsProp.get('range.rdfaType')
        && rdfsProp.get('range.rdfaType').toLowerCase() === rangeUri;
    });
  }

  async getPropertiesFromType(typeUri){
    typeUri = typeUri.toLowerCase();
    await waitForProperty(this, 'metaModelLoaded', true);
    return this.store.peekAll('rdfs-property').filter(rdfsProp => {
      return rdfsProp.get('domain')
        .filter(cl => cl.rdfaType) //TODO: why properties whithout type?
        .find(cl => cl.rdfaType.toLowerCase() === typeUri);
    });
  }

  async getMetaModelForType(typeUri){
    typeUri = typeUri.toLowerCase();
    await waitForProperty(this, 'metaModelLoaded', true);
    return this.store.peekAll('rdfs-class').find(r => (r.rdfaType || '').toLowerCase() == typeUri);
  }

  async getMetaModelForLabel(label){
    await this.loadMetaModel.perform();
    await waitForProperty(this, 'metaModelLoaded', true);
    return this.store.peekAll('rdfs-class').find(r => (r.label || '').toLowerCase() == label.toLowerCase());
  }

  async getPropertiesForLabel(label){
    await waitForProperty(this, 'metaModelLoaded', true);
    return this.store.peekAll('rdfs-property').filter(r => (r.label || '').toLowerCase() == label.toLowerCase());
  }
};
