import Service from '@ember/service';
import { A } from '@ember/array';
import EmberObject from '@ember/object';
import { warn } from '@ember/debug';
import uuid from 'uuid/v4';
import { inject as service } from '@ember/service';

/**
 * collection of util functions which help deserialize triples to an ember Object.
 *
 *  NOTES
 *  -----
 * - serialization is still TODO
 * - this might be considered as a preliminary version, so lots of edge cases and evolution might occur.
 * - relations will always be returned as EmberArrays (basically, metaModel does noet speak about hasMany/hasOne)
 */
export default Service.extend({
  metaModelQuery: service(),

  /**
   * Given a type uri, construct all resources in collection of triples
   *
   * @method getAllResourcesForType
   * @param {String} typeUri
   * @param {Array} [{subject, predicate, object}]
   * @param {Boolean} OPTIONAL: get your properties camelCased
   *
   * @return {Array} [{_meta: metaModel, prop_1, ..., prop_n}]
   *
   * @public
   */
  async getAllResourcesForType(type, triples, camelCaseProperties = false){
    let subjectUris = triples.filter(t => t.predicate == 'a' && t.object == type).map(t => t.subject);
    subjectUris = A(Array.from(new Set(subjectUris)));
    return await Promise.all(subjectUris.map(async uri => await this.constructResource(uri, triples, type, camelCaseProperties)));
  },

  /**
   * Given a subjectUri, try to construct a resource from array of triples.
   * If no type is given, it will try to infer the type
   *
   * @method constructResource
   * @param {String} subjectUri
   * @param {Array} [{subject, predicate, object}
   * @param {String} OPTIONAL typeUri
   * @param {Boolean} OPTIONAl: get your properties camelCased
   *
   * @return {Object} {_meta: metaModel, prop_1, ..., prop_n}]
   *
   * @public
   */
  async constructResource(subjectUri, triples, type = null, camelCaseProperties = false){
    let resource = EmberObject.create({ _meta: EmberObject.create() });
    if(!type)
      type = (triples.find(t => t.predicate == 'a' && t.subject == subjectUri) || {}).object;

    if(!type){
      warn(`No type found for ${subjectUri}`, {id: 'triples-serialization-utils.constructResource'});
      return resource;
    }
    //TODO: what if nothing found
    let metaDataType = await this.metaModelQuery.getMetaModelForType(type);
    resource.set('uri', subjectUri);
    resource._meta.set('class', metaDataType);
    let metaProps = await this.metaModelQuery.getPropertiesFromType(type);
    await Promise.all(metaProps.map(async p => {
      let propLabel = camelCaseProperties ? this.toCamelCase(p.label) : p.label;
      resource._meta.set(propLabel, p);
      resource.set(propLabel, await this.constructDataFromProperty(p, subjectUri, triples));
    }));

    return resource;
  },

  /**
   * Creates an empty resource for specific
   * @method  createEmptyResource
   * @param {String} typeUri
   * @param {Boolean} OPTIONAl: get your properties camelCased
   *
   * @return {Object} {_meta: metaModel, prop_1, ..., prop_n}
   *
   * @public
   */
  async createEmptyResource(type, camelCaseProperties = false){
    let resource = EmberObject.create({ _meta: EmberObject.create() });
    let metaDataType = await this.metaModelQuery.getMetaModelForType(type);
    if(!metaDataType){
      warn(`No type found for ${type}`, {id: 'triples-serialization-utils.createEmptyResource'});
      return null;
    }

    resource.set('uri', metaDataType.baseUri.replace(/\/+$/, "") + '/' +  uuid());
    resource._meta.set('class', metaDataType);
    let metaProps = await this.metaModelQuery.getPropertiesFromType(type);
    metaProps.forEach(p => {
      let propLabel = camelCaseProperties ? this.toCamelCase(p.label) : p.label;
      resource._meta.set(propLabel, p);
      resource.set(propLabel, null);
    });
    return resource;
  },

  /**
   * Given a metaProperty and subjectUri, this function will try to fetch the data associated with it.
   * - If primitive, it will return the value, else an array of EmberObjects will be returned
   * @method constructDataFromProperty
   * @param {Object} metaProperty
   * @param {String} subjectUri
   * @param {Array} [{subject, predicate, object}]
   * @param {Boolean} OPTIONAL: get your properties camelCased
   *
   * @return {Object|str} [{_meta: metaModel, prop_1, ..., prop_n}] or "value from primitive property"
   *
   * @private
   */
  async constructDataFromProperty(metaProperty, subjectUri, triples, camelCaseProperties = false){
    if(await metaProperty.get('range.isPrimitive')){
      //we the last occurence of the triple is considered the correct value
      let triple = triples.slice(0).reverse().find(t => t.predicate == metaProperty.rdfaType && t.subject == subjectUri);
      return triple ? triple.object : null;
    }

    //can be many so take all occurences
    let relationUris = (triples
                        .filter(t => t.predicate == metaProperty.rdfaType && t.subject == subjectUri) || [])
                        .map( t => t.object) ; //we assume these are URI's!!!

    //TODO: some weird stuff where context scanner generates double subject uri's
    relationUris  = A(Array.from(new Set(relationUris)));

    let resources = await Promise.all(relationUris.map(async uri => await this.constructResource(uri,
                                                                                          triples,
                                                                                          await metaProperty.get('range.rdfaType'),
                                                                                            camelCaseProperties)));
    return A(resources);
  },

  toCamelCase(property){
    let tokens = property.split('-');
    let newString = tokens[0];
    tokens.slice(1).forEach(t => {
      newString += t.replace(/^./, str => str.toUpperCase());
    });
    return newString;
  }
});
