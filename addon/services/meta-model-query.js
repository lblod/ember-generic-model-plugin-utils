import Service, { inject as service } from '@ember/service';

export default Service.extend({
  store: service(),
  metaModelLoaded: false,

  async loadMetaModel(){
    if(this.metaModelLoaded)
      return;

    let queryParams = {
      include:'range,domain',
      page: { size: 10000 }
    };
    await this.get('store').query('rdfs-property', queryParams);
    this.set('metaModelLoaded', true);
  },

  //TODO: rename this function
  async findPropertiesWithRange(typeUri, rangeUri){
    typeUri = typeUri.toLowerCase();
    rangeUri = rangeUri.toLowerCase();
    await this.loadMetaModel();

    return this.get('store').peekAll('rdfs-property').filter(rdfsProp => {
      return rdfsProp.get('domain')
        .filter(cl => cl.rdfaType)
        .find(cl => cl.rdfaType.toLowerCase() === typeUri)
        && rdfsProp.get('range.rdfaType')
        && rdfsProp.get('range.rdfaType').toLowerCase() === rangeUri;
    });
  },

  async getPropertiesFromType(typeUri){
    typeUri = typeUri.toLowerCase();
    await this.loadMetaModel();
    return this.get('store').peekAll('rdfs-property').filter(rdfsProp => {
      return rdfsProp.get('domain')
        .filter(cl => cl.rdfaType) //TODO: why properties whithout type?
        .find(cl => cl.rdfaType.toLowerCase() === typeUri);
    });
  },

  async getMetaModelForType(typeUri){
    typeUri = typeUri.toLowerCase();
    await this.loadMetaModel();
    return this.get('store').peekAll('rdfs-class').find(r => (r.rdfaType || '').toLowerCase() == typeUri);
  },

  async getMetaModelForLabel(label){
    await this.loadMetaModel();
    return this.get('store').peekAll('rdfs-class').find(r => (r.label || '').toLowerCase() == label.toLowerCase());
  },

  async getPropertiesForLabel(label){
    await this.loadMetaModel();
    return this.get('store').peekAll('rdfs-property').filter(r => (r.label || '').toLowerCase() == label.toLowerCase());
  }

});
